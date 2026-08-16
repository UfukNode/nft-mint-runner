export function validateQuantity(quantity: unknown, maxPerWallet?: number): number {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("NFTs per wallet must be a positive whole number.");
  }
  if (parsed > 1000) {
    throw new Error("Quantity is too large for a single wallet mint.");
  }
  if (maxPerWallet && parsed > maxPerWallet) {
    throw new Error(`Quantity exceeds the on-chain per-wallet limit of ${maxPerWallet}.`);
  }
  return parsed;
}
