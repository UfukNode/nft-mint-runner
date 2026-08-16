import { weiToEth, weiToGwei, isoFromSeconds } from "../core/format.js";
import type { ChainConfig } from "../core/chains.js";
import type { PublicDropConfig } from "../core/seadrop.js";
import type { RpcEndpoint } from "../core/rpc.js";
import type { WalletRecord } from "../core/wallets.js";
import type { WalletExecutionResult, MintSession } from "./session-store.js";

export function chainView(chain: ChainConfig) {
  return {
    key: chain.key,
    name: chain.name,
    chainId: chain.chainId,
    nativeSymbol: chain.nativeSymbol,
    explorerBaseUrl: chain.explorerBaseUrl,
    defaultRpcUrls: chain.defaultRpcUrls
  };
}

export function dropView(drop: PublicDropConfig, chain: ChainConfig, label?: string) {
  return {
    label,
    nftContract: drop.nftContract,
    seaDropAddress: drop.seaDropAddress,
    mintPriceWei: drop.mintPriceWei.toString(),
    mintPrice: weiToEth(drop.mintPriceWei, chain.nativeSymbol),
    startTime: drop.startTime,
    startTimeIso: isoFromSeconds(drop.startTime),
    endTime: drop.endTime,
    endTimeIso: isoFromSeconds(drop.endTime),
    maxTotalMintableByWallet: drop.maxTotalMintableByWallet,
    feeBps: drop.feeBps,
    restrictFeeRecipients: drop.restrictFeeRecipients,
    feeRecipient: drop.feeRecipient,
    allowedFeeRecipients: drop.allowedFeeRecipients,
    creatorPayoutAddress: drop.creatorPayoutAddress,
    allowListConfigured: drop.allowListConfigured,
    signedMintConfigured: drop.signedMintConfigured,
    tokenGatedConfigured: drop.tokenGatedConfigured,
    status: drop.status,
    source: drop.source,
    unsupportedReason: drop.unsupportedReason
  };
}

export function rpcView(endpoint: RpcEndpoint) {
  return {
    label: endpoint.label,
    url: endpoint.redactedUrl,
    status: endpoint.status,
    latencyMs: endpoint.latencyMs,
    chainId: endpoint.chainId,
    readCapable: endpoint.readCapable,
    broadcastCapable: endpoint.broadcastCapable,
    error: endpoint.error
  };
}

export function walletView(wallet: WalletRecord, chain: ChainConfig) {
  return {
    id: wallet.id,
    address: wallet.address,
    shortAddress: wallet.shortAddress,
    balanceWei: wallet.balanceWei.toString(),
    balance: weiToEth(wallet.balanceWei, chain.nativeSymbol)
  };
}

export function gasView(session: MintSession) {
  if (!session.gas) return undefined;
  return {
    maxFeePerGasWei: session.gas.maxFeePerGas.toString(),
    maxFeePerGas: weiToGwei(session.gas.maxFeePerGas),
    maxPriorityFeePerGasWei: session.gas.maxPriorityFeePerGas.toString(),
    maxPriorityFeePerGas: weiToGwei(session.gas.maxPriorityFeePerGas),
    gasLimit: session.gas.gasLimit.toString(),
    warnings: session.gas.warnings
  };
}

export function resultView(result: WalletExecutionResult) {
  return {
    ...result,
    endpointResults: result.endpointResults ?? []
  };
}
