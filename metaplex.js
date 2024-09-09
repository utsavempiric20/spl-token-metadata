const {
  createMetadataAccountV3,
  updateMetadataAccountV2,
  findMetadataPda,
} = require("@metaplex-foundation/mpl-token-metadata");
const web3 = require("@solana/web3.js");
const {
  createSignerFromKeypair,
  none,
  signerIdentity,
  some,
} = require("@metaplex-foundation/umi");
const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} = require("@metaplex-foundation/umi-web3js-adapters");
const fs = require("fs");

function loadWalletKey(keypairFile) {
  const loaded = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
  );
  return loaded;
}

const INITIALIZE = false;

async function main() {
  const myKeypair = loadWalletKey("./my-keypair.json");
  const mint = new web3.PublicKey(
    "L7sZhTjqpxsb8YEdjUq21NzpWPxUdWBydvPKiUchkGh"
  );

  const umi = createUmi("https://api.devnet.solana.com");
  const signer = createSignerFromKeypair(umi, fromWeb3JsKeypair(myKeypair));
  umi.use(signerIdentity(signer, true));

  const ourMetadata = {
    name: "Cat Top Token",
    symbol: "CTT",
    uri: "https://raw.githubusercontent.com/utsavempiric20/spl-token-metadata/main/metadata.json",
  };
  const onChainData = {
    ...ourMetadata,
    sellerFeeBasisPoints: 0,
    creators: none(),
    collection: none(),
    uses: none(),
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
    try {
      const txid = await createMetadataAccountV3(umi, {
        ...accounts,
        ...data,
      }).sendAndConfirm(umi);
      console.log(txid);
    } catch (error) {
      console.error("Error creating metadata account:", error);
    }
  } else {
    const data = {
      data: some(onChainData),
      discriminator: 0,
      isMutable: some(true),
      newUpdateAuthority: none(),
      primarySaleHappened: none(),
    };
    const accounts = {
      metadata: findMetadataPda(umi, { mint: fromWeb3JsPublicKey(mint) }),
      updateAuthority: signer,
    };
    try {
      const txid = await updateMetadataAccountV2(umi, {
        ...accounts,
        ...data,
      }).sendAndConfirm(umi);
      console.log(txid);
    } catch (error) {
      console.error("Error updating metadata account:", error);
    }
  }
}

main();
