import type { TransactionReceipt } from "ethers";
import { JsonRpcClient, type RpcEndpoint } from "./rpc.js";
import { redactText } from "./secrets.js";

export type EndpointBroadcastResult = {
  endpoint: string;
  status: "accepted" | "duplicate" | "rejected";
  message: string;
};

export async function broadcastRawTransaction(
  rawTransaction: string,
  endpoints: RpcEndpoint[]
): Promise<EndpointBroadcastResult[]> {
  return Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const hash = await new JsonRpcClient(endpoint.url).call<string>("eth_sendRawTransaction", [rawTransaction]);
        return { endpoint: endpoint.redactedUrl, status: "accepted", message: hash };
      } catch (error) {
        const message = redactText(error instanceof Error ? error.message : String(error));
        if (isDuplicateTxMessage(message)) {
          return { endpoint: endpoint.redactedUrl, status: "duplicate", message };
        }
        return { endpoint: endpoint.redactedUrl, status: "rejected", message };
      }
    })
  );
}

export async function waitForReceipt(input: {
  getReceipt: (hash: string) => Promise<TransactionReceipt | null>;
  hash: string;
  timeoutMs: number;
  intervalMs: number;
}): Promise<TransactionReceipt | null> {
  const deadline = Date.now() + input.timeoutMs;
  while (Date.now() < deadline) {
    const receipt = await input.getReceipt(input.hash);
    if (receipt) {
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, input.intervalMs));
  }
  return null;
}

export function isDuplicateTxMessage(message: string): boolean {
  return /already known|already exists|known transaction|already imported|replacement transaction underpriced/i.test(message);
}
