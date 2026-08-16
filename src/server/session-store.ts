import crypto from "node:crypto";
import { JsonRpcProvider, type TransactionReceipt } from "ethers";
import type { ChainConfig } from "../core/chains.js";
import type { GasPlan } from "../core/gas.js";
import type { PublicDropConfig } from "../core/seadrop.js";
import type { MintState } from "../core/state-machine.js";
import { nextState } from "../core/state-machine.js";
import type { RpcEndpoint } from "../core/rpc.js";
import type { SensitiveWallet } from "../core/wallets.js";
import type { PreparedMintTx } from "../core/transactions.js";
import type { EndpointBroadcastResult } from "../core/broadcast.js";

export type WalletExecutionStatus =
  | "Prepared"
  | "Broadcasting"
  | "Accepted"
  | "Confirmed"
  | "Reverted"
  | "Rejected"
  | "Timeout"
  | "Nonce invalid"
  | "Insufficient funds";

export type WalletExecutionResult = {
  walletId: string;
  address: string;
  status: WalletExecutionStatus;
  txHash?: string;
  endpointResults?: EndpointBroadcastResult[];
  blockNumber?: number;
  gasUsed?: string;
  receiptStatus?: number;
  explorerUrl?: string;
  message?: string;
};

export type MintSession = {
  id: string;
  chain: ChainConfig;
  provider: JsonRpcProvider;
  readRpcUrl: string;
  rpcEndpoints: RpcEndpoint[];
  drop?: PublicDropConfig;
  label?: string;
  state: MintState;
  wallets: SensitiveWallet[];
  quantity?: number;
  gas?: GasPlan;
  refreshGasBeforeBroadcast: boolean;
  prepared: PreparedMintTx[];
  results: WalletExecutionResult[];
  createdAt: number;
  expiresAt: number;
  timer?: NodeJS.Timeout;
};

const SESSION_TTL_MS = 45 * 60 * 1000;

export class SessionStore {
  private readonly sessions = new Map<string, MintSession>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.clearExpired(), 60_000);
    this.cleanupTimer.unref();
  }

  create(input: {
    chain: ChainConfig;
    provider: JsonRpcProvider;
    readRpcUrl: string;
    rpcEndpoints: RpcEndpoint[];
    drop?: PublicDropConfig;
    label?: string;
  }): MintSession {
    const id = crypto.randomBytes(24).toString("base64url");
    const now = Date.now();
    const session: MintSession = {
      id,
      chain: input.chain,
      provider: input.provider,
      readRpcUrl: input.readRpcUrl,
      rpcEndpoints: input.rpcEndpoints,
      drop: input.drop,
      label: input.label,
      state: input.drop ? "CONFIGURING" : "IDLE",
      wallets: [],
      refreshGasBeforeBroadcast: true,
      prepared: [],
      results: [],
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): MintSession {
    const session = this.sessions.get(id);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) this.destroy(id);
      throw new Error("Session expired or not found.");
    }
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return session;
  }

  transition(session: MintSession, state: MintState): void {
    session.state = nextState(session.state, state);
  }

  destroy(id: string): void {
    const session = this.sessions.get(id);
    if (session?.timer) {
      clearTimeout(session.timer);
    }
    if (session) {
      session.prepared = [];
      session.wallets = [];
    }
    this.sessions.delete(id);
  }

  cancel(id: string): MintSession {
    const session = this.get(id);
    if (session.state === "BROADCASTING" || session.state === "CONFIRMING") {
      throw new Error("Transactions have already been broadcast and cannot be cancelled.");
    }
    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = undefined;
    }
    session.prepared = [];
    session.results = [];
    session.state = "CANCELLED";
    return session;
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.destroy(id);
      }
    }
  }
}

export function receiptToResult(
  result: WalletExecutionResult,
  receipt: TransactionReceipt,
  explorerBaseUrl: string
): WalletExecutionResult {
  const txHash = result.txHash ?? receipt.hash;
  return {
    ...result,
    status: receipt.status === 1 ? "Confirmed" : "Reverted",
    txHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    receiptStatus: receipt.status ?? undefined,
    explorerUrl: `${explorerBaseUrl}/tx/${txHash}`
  };
}
