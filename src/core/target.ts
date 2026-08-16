import { getAddress, isAddress } from "ethers";
import type { ChainConfig } from "./chains.js";

export type ParsedTarget =
  | { kind: "contract"; contractAddress: string; label?: string }
  | { kind: "opensea-item"; contractAddress: string; tokenId: string; label?: string }
  | { kind: "opensea-collection"; slug: string; label: string; needsContract: true };

export function parseNftTarget(input: string, chain: ChainConfig): ParsedTarget {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter an NFT contract address or supported OpenSea URL.");
  }

  if (isAddress(trimmed)) {
    return { kind: "contract", contractAddress: getAddress(trimmed) };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Target must be an EVM address or a valid OpenSea URL.");
  }

  if (!["opensea.io", "www.opensea.io"].includes(url.hostname.toLowerCase())) {
    throw new Error("Only raw addresses and opensea.io URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "assets" && parts.length >= 4) {
    const chainSlug = parts[1]?.toLowerCase() ?? "";
    if (!chain.openSeaSlugs.includes(chainSlug)) {
      throw new Error(`OpenSea URL is for ${chainSlug}; selected network is ${chain.name}.`);
    }
    const contract = parts[2] ?? "";
    if (!isAddress(contract)) {
      throw new Error("OpenSea asset URL does not contain a valid contract address.");
    }
    return {
      kind: "opensea-item",
      contractAddress: getAddress(contract),
      tokenId: parts[3] ?? "",
      label: `OpenSea item ${parts[3] ?? ""}`
    };
  }

  if (parts[0] === "collection" && parts[1]) {
    return {
      kind: "opensea-collection",
      slug: parts[1],
      label: parts[1],
      needsContract: true
    };
  }

  throw new Error("Unsupported OpenSea URL. Use /collection/<slug> or /assets/<chain>/<contract>/<tokenId>.");
}
