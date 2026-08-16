import { Wallet, getAddress } from "ethers";
import type { JsonRpcProvider } from "ethers";
import { shortAddress } from "./format.js";

export type WalletRecord = {
  id: string;
  address: string;
  shortAddress: string;
  balanceWei: bigint;
};

export type SensitiveWallet = WalletRecord & {
  wallet: Wallet;
};

export async function walletFromPrivateKey(id: string, privateKey: string, provider: JsonRpcProvider): Promise<SensitiveWallet> {
  const wallet = new Wallet(privateKey.trim(), provider);
  const address = getAddress(wallet.address);
  const balanceWei = await provider.getBalance(address);
  return {
    id,
    address,
    shortAddress: shortAddress(address),
    balanceWei,
    wallet
  };
}

export async function refreshWalletBalances(wallets: SensitiveWallet[], provider: JsonRpcProvider): Promise<SensitiveWallet[]> {
  return Promise.all(
    wallets.map(async (wallet) => ({
      ...wallet,
      balanceWei: await provider.getBalance(wallet.address)
    }))
  );
}

export function publicWallet(record: SensitiveWallet): WalletRecord {
  return {
    id: record.id,
    address: record.address,
    shortAddress: record.shortAddress,
    balanceWei: record.balanceWei
  };
}
