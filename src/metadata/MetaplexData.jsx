import React, { useState, useEffect } from "react";
import {
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import {
  createSignerFromKeypair,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

const keypairData = JSON.parse(process.env.KEYPAIR_DATA);
const myKeypair = web3.Keypair.fromSecretKey(new Uint8Array(keypairData));

const INITIALIZE = true;

const MetaplexData = () => {
  const [txid, setTxid] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const main = async () => {
      try {
        console.log("let's name some tokens in 2024!");
        const mint = new web3.PublicKey(
          "L7sZhTjqpxsb8YEdjUq21NzpWPxUdWBydvPKiUchkGh"
        );

        const umi = createUmi("https://api.devnet.solana.com").use(
          mplTokenMetadata()
        );
        const signer = createSignerFromKeypair(
          umi,
          fromWeb3JsKeypair(myKeypair)
        );
        umi.use(signerIdentity(signer, true));

        const ourMetadata = {
          name: "Cat Top Token",
          symbol: "CTT",
          description:
            "Just a test for how to name your token, again and again ;)",
          uri: "https://raw.githubusercontent.com/utsavempiric20/spl-token-metadata/main/src/metadata/metadata.json",
        };

        const onChainData = {
          ...ourMetadata,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        };

        if (INITIALIZE) {
          const accounts = {
            mint: fromWeb3JsPublicKey(mint),
            mintAuthority: signer,
          };
          const data = {
            isMutable: true,
            collectionDetails: null,
            data: onChainData,
          };
          const txid = await createMetadataAccountV3(umi, {
            ...accounts,
            ...data,
          }).sendAndConfirm(umi);
          setTxid(txid);
        } else {
          const data = {
            data: some(onChainData) || undefined,
            discriminator: 0,
            isMutable: some(true),
            newUpdateAuthority: undefined,
            primarySaleHappened: undefined,
          };
          const accounts = {
            metadata: findMetadataPda(umi, { mint: fromWeb3JsPublicKey(mint) }),
            updateAuthority: signer,
          };
          const txid = await updateMetadataAccountV2(umi, {
            ...accounts,
            ...data,
          }).sendAndConfirm(umi);
          setTxid(txid);
        }
      } catch (err) {
        console.error("Error occurred:", err);
        setError(err.message);
      }
    };

    main();
  }, []);

  return (
    <div>
      <h1>Token Metadata Manager</h1>
      {txid && <p>Transaction ID: {txid}</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default MetaplexData;
