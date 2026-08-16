import { keccak256, Transaction, type JsonRpcProvider } from "ethers";
import type { ChainConfig } from "./chains.js";
import type { GasPlan } from "./gas.js";
import type { PublicDropConfig } from "./seadrop.js";
import { buildMintCalldata, totalMintValue } from "./seadrop.js";
import type { SensitiveWallet } from "./wallets.js";

export type PreparedMintTx = {
  walletId: string;
  address: string;
  nonce: number;
  hash: string;
  rawTransaction: string;
  valueWei: bigint;
  gasLimit: bigint;
};

export async function prepareMintTransaction(input: {
  provider: JsonRpcProvider;
  chain: ChainConfig;
  wallet: SensitiveWallet;
  drop: PublicDropConfig;
  quantity: number;
  gas: GasPlan;
}): Promise<PreparedMintTx> {
  const nonce = await input.provider.getTransactionCount(input.wallet.address, "pending");
  const valueWei = totalMintValue(input.drop.mintPriceWei, input.quantity);
  const data = buildMintCalldata(input.drop.nftContract, input.drop.feeRecipient, input.wallet.address, input.quantity);
  const tx = {
    type: 2,
    to: input.drop.seaDropAddress,
    chainId: BigInt(input.chain.chainId),
    nonce,
    data,
    value: valueWei,
    gasLimit: input.gas.gasLimit,
    maxFeePerGas: input.gas.maxFeePerGas,
    maxPriorityFeePerGas: input.gas.maxPriorityFeePerGas
  };
  const rawTransaction = await input.wallet.wallet.signTransaction(tx);
  return {
    walletId: input.wallet.id,
    address: input.wallet.address,
    nonce,
    hash: Transaction.from(rawTransaction).hash ?? keccak256(rawTransaction),
    rawTransaction,
    valueWei,
    gasLimit: input.gas.gasLimit
  };
}
