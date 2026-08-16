export type AffordabilityInput = {
  balanceWei: bigint;
  mintValueWei: bigint;
  gasLimit: bigint;
  maxFeePerGas: bigint;
};

export type AffordabilityResult = {
  requiredWei: bigint;
  gasReservationWei: bigint;
  ready: boolean;
  shortfallWei: bigint;
};

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult {
  const gasReservationWei = input.gasLimit * input.maxFeePerGas;
  const requiredWei = input.mintValueWei + gasReservationWei;
  const ready = input.balanceWei >= requiredWei;
  return {
    requiredWei,
    gasReservationWei,
    ready,
    shortfallWei: ready ? 0n : requiredWei - input.balanceWei
  };
}
