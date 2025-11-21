import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import { AddressBook } from "./utils/address_book.js";
import {
  airdropAccount,
  airdropAddress,
  deployContract,
  installContract
} from "./utils/contract.js";
import { config } from "./utils/env_config.js";

export async function deployContracts(addressBook: AddressBook) {
  if (network != "mainnet") await airdropAccount(loadedConfig.admin);
  let account = await loadedConfig.horizonRpc.loadAccount(
    loadedConfig.admin.publicKey()
  );
  console.log("publicKey", loadedConfig.admin.publicKey());
  let balance = account.balances.filter((item) => item.asset_type == "native");
  console.log("Current Admin account balance:", balance[0].balance);

  console.log("-------------------------------------------------------");
  console.log("Deploying vinifica Factory");
  console.log("-------------------------------------------------------");
  await installContract("vinifica_vault", addressBook, loadedConfig.admin);
  await installContract("vinifica_factory", addressBook, loadedConfig.admin);

  const vinificaReceiver = loadedConfig.vinificaFeeReceiver;
  const vinificaFee = loadedConfig.vinificaFee;
  if (network != "mainnet") await airdropAddress(vinificaReceiver);

  const factoryInitParams: xdr.ScVal[] = [
    new Address(loadedConfig.vinificaFactoryAdmin).toScVal(),
    new Address(vinificaReceiver).toScVal(),
    nativeToScVal(vinificaFee, {type: "u32"}),
    nativeToScVal(Buffer.from(addressBook.getWasmHash("vinifica_vault"), "hex")),
  ];

  await deployContract(
    "vinifica_factory",
    "vinifica_factory",
    addressBook,
    factoryInitParams,
    loadedConfig.admin
  );
}

const network = process.argv[2];
const loadedConfig = config(network);
const addressBook = AddressBook.loadFromFile(network);

try {
  await deployContracts(addressBook);
} catch (e) {
  console.error(e);
}
addressBook.writeToFile();
