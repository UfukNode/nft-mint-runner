import type { ChainConfig } from "./chains.js";
import { redactRpcUrl } from "./secrets.js";

export type RpcStatus = "Connected" | "Wrong network" | "Unavailable" | "Send-only";

export type RpcEndpoint = {
  url: string;
  label: string;
  redactedUrl: string;
  status: RpcStatus;
  latencyMs?: number;
  chainId?: number;
  readCapable: boolean;
  broadcastCapable: boolean;
  error?: string;
};

export class JsonRpcClient {
  constructor(public readonly url: string, private readonly timeoutMs = 8000) {}

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const body = (await response.json()) as { result?: T; error?: { message?: string } };
      if (body.error) {
        throw new Error(body.error.message || "RPC error");
      }
      return body.result as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function classifyRpcUrl(url: string, chain: ChainConfig): Promise<RpcEndpoint> {
  const started = performance.now();
  const redactedUrl = redactRpcUrl(url);
  const base = {
    url,
    label: labelRpc(url),
    redactedUrl,
    readCapable: false,
    broadcastCapable: false
  };

  try {
    const client = new JsonRpcClient(url);
    const chainIdHex = await client.call<string>("eth_chainId");
    const latencyMs = Math.round(performance.now() - started);
    const chainId = Number.parseInt(chainIdHex, 16);
    if (chainId !== chain.chainId) {
      return { ...base, status: "Wrong network", latencyMs, chainId };
    }
    return {
      ...base,
      status: "Connected",
      latencyMs,
      chainId,
      readCapable: true,
      broadcastCapable: true
    };
  } catch (error) {
    const sendOnly = await looksBroadcastOnly(url);
    return {
      ...base,
      status: sendOnly ? "Send-only" : "Unavailable",
      broadcastCapable: sendOnly,
      error: error instanceof Error ? error.message : "RPC unavailable"
    };
  }
}

export async function classifyRpcUrls(urls: string[], chain: ChainConfig): Promise<RpcEndpoint[]> {
  return Promise.all(urls.map((url) => classifyRpcUrl(url, chain)));
}

async function looksBroadcastOnly(url: string): Promise<boolean> {
  try {
    const client = new JsonRpcClient(url);
    await client.call("eth_sendRawTransaction", ["0x"]);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return (
      message.includes("raw transaction") ||
      message.includes("rlp") ||
      message.includes("decode") ||
      message.includes("invalid transaction") ||
      message.includes("transaction type")
    );
  }
}

export function healthyReadEndpoint(endpoints: RpcEndpoint[]): RpcEndpoint | undefined {
  return endpoints.find((endpoint) => endpoint.status === "Connected" && endpoint.readCapable);
}

export function broadcastEndpoints(endpoints: RpcEndpoint[]): RpcEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.broadcastCapable && endpoint.status !== "Wrong network");
}

function labelRpc(input: string): string {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host.includes("alchemy")) return "Alchemy";
    if (host.includes("infura")) return "Infura";
    if (host.includes("publicnode")) return "PublicNode";
    if (host.includes("ankr")) return "Ankr";
    if (host.includes("robinhood")) return "Robinhood";
    if (host.includes("base.org")) return "Base";
    return host;
  } catch {
    return "Custom RPC";
  }
}
