import type { MintSession, WalletExecutionResult } from "./session-store.js";
import { receiptToResult } from "./session-store.js";
import { broadcastRawTransaction, waitForReceipt } from "../core/broadcast.js";
import { broadcastEndpoints } from "../core/rpc.js";
import { calculateAffordability } from "../core/affordability.js";
import { totalMintValue } from "../core/seadrop.js";
import { refreshWalletBalances } from "../core/wallets.js";
import { prepareMintTransaction } from "../core/transactions.js";
import type { GasPlan } from "../core/gas.js";

export async function runBroadcast(session: MintSession): Promise<void> {
  session.state = "BROADCASTING";
  const endpoints = broadcastEndpoints(session.rpcEndpoints);
  if (endpoints.length === 0) {
    throw new Error("No healthy broadcast-capable RPC endpoint is available.");
  }

  if (session.refreshGasBeforeBroadcast) {
    await refreshPreparedTransactions(session);
  }
  if (session.prepared.length === 0) {
    throw new Error("No prepared transactions remain after final validation.");
  }

  const preservedResults = session.results.filter((result) => result.status === "Insufficient funds");
  session.results = [
    ...preservedResults,
    ...session.prepared.map((tx) => ({
      walletId: tx.walletId,
      address: tx.address,
      status: "Broadcasting" as const,
      txHash: tx.hash
    }))
  ];

  await Promise.all(
    session.prepared.map(async (tx) => {
      const endpointResults = await broadcastRawTransaction(tx.rawTransaction, endpoints);
      const accepted = endpointResults.some((item) => item.status === "accepted" || item.status === "duplicate");
      updateResult(session, tx.walletId, {
        status: accepted ? "Accepted" : "Rejected",
        endpointResults,
        message: accepted ? "Transaction accepted by at least one endpoint." : "Every endpoint rejected the transaction."
      });
    })
  );

  session.state = "CONFIRMING";
  await Promise.all(
    session.results.map(async (result) => {
      if (!result.txHash || result.status === "Rejected") return;
      const receipt = await waitForReceipt({
        hash: result.txHash,
        timeoutMs: 180_000,
        intervalMs: 4_000,
        getReceipt: (hash) => session.provider.getTransactionReceipt(hash)
      });
      if (!receipt) {
        updateResult(session, result.walletId, { status: "Timeout", message: "No receipt before timeout." });
        return;
      }
      updateFullResult(session, receiptToResult(result, receipt, session.chain.explorerBaseUrl));
    })
  );

  session.prepared = [];
  session.wallets = [];
  session.state = session.results.some((result) => result.status === "Confirmed") ? "COMPLETED" : "FAILED";
}

async function refreshPreparedTransactions(session: MintSession): Promise<void> {
  if (!session.drop || !session.gas || !session.quantity) {
    return;
  }

  const refreshedGas = await refreshedGasPlan(session);
  session.gas = refreshedGas;
  session.wallets = await refreshWalletBalances(session.wallets, session.provider);

  const preparedWalletIds = new Set(session.prepared.map((tx) => tx.walletId));
  const mintValueWei = totalMintValue(session.drop.mintPriceWei, session.quantity);
  const readyWallets = session.wallets.filter((wallet) => {
    if (!preparedWalletIds.has(wallet.id)) return false;
    const affordability = calculateAffordability({
      balanceWei: wallet.balanceWei,
      mintValueWei,
      gasLimit: refreshedGas.gasLimit,
      maxFeePerGas: refreshedGas.maxFeePerGas
    });
    if (!affordability.ready) {
      session.results.push({
        walletId: wallet.id,
        address: wallet.address,
        status: "Insufficient funds",
        message: "Balance is below the refreshed gas reservation."
      });
    }
    return affordability.ready;
  });

  session.prepared = await Promise.all(
    readyWallets.map((wallet) =>
      prepareMintTransaction({
        provider: session.provider,
        chain: session.chain,
        wallet,
        drop: session.drop!,
        quantity: session.quantity!,
        gas: refreshedGas
      })
    )
  );
}

async function refreshedGasPlan(session: MintSession): Promise<GasPlan> {
  const feeData = await session.provider.getFeeData();
  const block = await session.provider.getBlock("latest");
  const baseFeeWei = block?.baseFeePerGas ?? feeData.gasPrice ?? 0n;
  const suggestedPriority = feeData.maxPriorityFeePerGas ?? session.gas!.maxPriorityFeePerGas;
  const priority = maxBigInt(session.gas!.maxPriorityFeePerGas, suggestedPriority);
  const refreshedMaxFee = baseFeeWei * 3n + priority;
  return {
    ...session.gas!,
    maxPriorityFeePerGas: priority,
    maxFeePerGas: maxBigInt(session.gas!.maxFeePerGas, refreshedMaxFee)
  };
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

function updateResult(session: MintSession, walletId: string, patch: Partial<WalletExecutionResult>): void {
  const current = session.results.find((result) => result.walletId === walletId);
  if (current) {
    Object.assign(current, patch);
  }
}

function updateFullResult(session: MintSession, next: WalletExecutionResult): void {
  const index = session.results.findIndex((result) => result.walletId === next.walletId);
  if (index >= 0) {
    session.results[index] = next;
  }
}
