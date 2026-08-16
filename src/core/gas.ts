import { gweiToWei } from "./format.js";

export type GasInput = {
  maxFeeGwei: string;
  priorityFeeGwei: string;
  gasLimit: string | number;
  baseFeeWei?: bigint;
};

export type GasPlan = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  warnings: string[];
};

export function validateGas(input: GasInput): GasPlan {
  const maxFee = parseGweiField(input.maxFeeGwei, "Max fee");
  const tip = parseGweiField(input.priorityFeeGwei, "Priority fee");
  const gasLimit = parseIntegerField(input.gasLimit, "Gas limit");
  const warnings: string[] = [];

  if (input.baseFeeWei !== undefined && maxFee < input.baseFeeWei) {
    throw new Error("Max fee per gas must be greater than or equal to the current base fee.");
  }
  if (tip > maxFee) {
    throw new Error("Max priority fee cannot exceed max fee per gas.");
  }
  if (gasLimit < 80_000n) {
    warnings.push("Gas limit is low for a SeaDrop ERC-721 mint.");
  }
  if (gasLimit > 500_000n) {
    warnings.push("Gas limit is unusually high; balance reservation will be larger.");
  }
  if (maxFee > gweiToWei("1000")) {
    warnings.push("Max fee is very high. Confirm this is intentional.");
  }

  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: tip, gasLimit, warnings };
}

function parseGweiField(value: string, label: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`${label} must be a finite non-negative number.`);
  }
  return gweiToWei(normalized);
}

function parseIntegerField(value: string | number, label: string): bigint {
  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be a whole non-negative number.`);
  }
  const parsed = BigInt(normalized);
  if (parsed === 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return parsed;
}
