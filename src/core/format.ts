import { formatEther, formatUnits, parseUnits } from "ethers";

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function weiToEth(wei: bigint, symbol = "ETH", precision = 6): string {
  const value = Number(formatEther(wei));
  if (!Number.isFinite(value)) {
    return `${formatEther(wei)} ${symbol}`;
  }
  return `${value.toFixed(precision).replace(/\.?0+$/, "")} ${symbol}`;
}

export function weiToGwei(wei: bigint): string {
  const value = Number(formatUnits(wei, "gwei"));
  return `${value.toFixed(4).replace(/\.?0+$/, "")} gwei`;
}

export function gweiToWei(value: string): bigint {
  return parseUnits(value.trim(), "gwei");
}

export function isoFromSeconds(seconds: number): string {
  if (!seconds) {
    return "Not configured";
  }
  return new Date(seconds * 1000).toISOString();
}
