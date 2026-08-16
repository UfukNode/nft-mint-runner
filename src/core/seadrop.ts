import { Contract, Interface, ZeroAddress, getAddress, isAddress } from "ethers";
import type { ChainConfig } from "./chains.js";
import type { JsonRpcProvider } from "ethers";

export type StageStatus = "Upcoming" | "Live" | "Ended" | "Unsupported";

export type PublicDropConfig = {
  nftContract: string;
  seaDropAddress: string;
  mintPriceWei: bigint;
  startTime: number;
  endTime: number;
  maxTotalMintableByWallet: number;
  feeBps: number;
  restrictFeeRecipients: boolean;
  feeRecipient: string;
  allowedFeeRecipients: string[];
  creatorPayoutAddress: string;
  allowListConfigured: boolean;
  signedMintConfigured: boolean;
  tokenGatedConfigured: boolean;
  status: StageStatus;
  source: "on-chain SeaDrop configuration";
  unsupportedReason?: string;
};

export const SEADROP_ABI = [
  "function getPublicDrop(address nftContract) view returns ((uint80 mintPrice,uint48 startTime,uint48 endTime,uint16 maxTotalMintableByWallet,uint16 feeBps,bool restrictFeeRecipients))",
  "function getCreatorPayoutAddress(address nftContract) view returns (address)",
  "function getAllowedFeeRecipients(address nftContract) view returns (address[])",
  "function getAllowListMerkleRoot(address nftContract) view returns (bytes32)",
  "function getSigners(address nftContract) view returns (address[])",
  "function getTokenGatedAllowedTokens(address nftContract) view returns (address[])",
  "function mintPublic(address nftContract,address feeRecipient,address minterIfNotPayer,uint256 quantity) payable"
];

export const NFT_ABI = [
  "function name() view returns (string)"
];

export const seaDropInterface = new Interface(SEADROP_ABI);

export async function inspectSeaDropPublicMint(
  provider: JsonRpcProvider,
  chain: ChainConfig,
  nftContractInput: string
): Promise<PublicDropConfig> {
  if (!isAddress(nftContractInput)) {
    throw new Error("NFT contract address is invalid.");
  }

  const nftContract = getAddress(nftContractInput);
  const seaDrop = new Contract(chain.seaDropAddress, SEADROP_ABI, provider) as any;
  const [drop, payout, recipients, allowListRoot, signers, tokenGatedTokens] = await Promise.all([
    seaDrop.getPublicDrop(nftContract),
    seaDrop.getCreatorPayoutAddress(nftContract).catch(() => ZeroAddress),
    seaDrop.getAllowedFeeRecipients(nftContract).catch(() => []),
    seaDrop.getAllowListMerkleRoot(nftContract).catch(() => "0x" + "0".repeat(64)),
    seaDrop.getSigners(nftContract).catch(() => []),
    seaDrop.getTokenGatedAllowedTokens(nftContract).catch(() => [])
  ]);

  const mintPriceWei = BigInt(drop.mintPrice);
  const startTime = Number(drop.startTime);
  const endTime = Number(drop.endTime);
  const maxTotalMintableByWallet = Number(drop.maxTotalMintableByWallet);
  const feeBps = Number(drop.feeBps);
  const restrictFeeRecipients = Boolean(drop.restrictFeeRecipients);
  const allowedFeeRecipients = (recipients as string[]).map((item) => getAddress(item));
  const feeRecipient = chooseFeeRecipient(restrictFeeRecipients, allowedFeeRecipients);
  const allowListConfigured = allowListRoot !== "0x" + "0".repeat(64);
  const signedMintConfigured = (signers as string[]).length > 0;
  const tokenGatedConfigured = (tokenGatedTokens as string[]).length > 0;
  const now = Math.floor(Date.now() / 1000);
  const unsupportedReason = unsupportedReasonFor({
    mintPriceWei,
    startTime,
    endTime,
    maxTotalMintableByWallet,
    feeRecipient,
    allowListConfigured,
    signedMintConfigured,
    tokenGatedConfigured
  });

  return {
    nftContract,
    seaDropAddress: getAddress(chain.seaDropAddress),
    mintPriceWei,
    startTime,
    endTime,
    maxTotalMintableByWallet,
    feeBps,
    restrictFeeRecipients,
    feeRecipient,
    allowedFeeRecipients,
    creatorPayoutAddress: isAddress(payout) ? getAddress(payout) : ZeroAddress,
    allowListConfigured,
    signedMintConfigured,
    tokenGatedConfigured,
    status: unsupportedReason ? "Unsupported" : stageStatus(now, startTime, endTime),
    source: "on-chain SeaDrop configuration",
    unsupportedReason
  };
}

export async function readCollectionLabel(provider: JsonRpcProvider, nftContract: string): Promise<string | undefined> {
  try {
    const nft = new Contract(nftContract, NFT_ABI, provider) as any;
    const name = await nft.name();
    return typeof name === "string" && name.trim() ? name.trim() : undefined;
  } catch {
    return undefined;
  }
}

export function buildMintCalldata(nftContract: string, feeRecipient: string, minter: string, quantity: number): string {
  return seaDropInterface.encodeFunctionData("mintPublic", [
    getAddress(nftContract),
    getAddress(feeRecipient),
    getAddress(minter),
    BigInt(quantity)
  ]);
}

export function totalMintValue(mintPriceWei: bigint, quantity: number): bigint {
  return mintPriceWei * BigInt(quantity);
}

function chooseFeeRecipient(restricted: boolean, recipients: string[]): string {
  if (restricted) {
    return recipients[0] ?? ZeroAddress;
  }
  return recipients[0] ?? "0x0000a26b00c1F0DF003000390027140000fAa719";
}

function unsupportedReasonFor(input: {
  mintPriceWei: bigint;
  startTime: number;
  endTime: number;
  maxTotalMintableByWallet: number;
  feeRecipient: string;
  allowListConfigured: boolean;
  signedMintConfigured: boolean;
  tokenGatedConfigured: boolean;
}): string | undefined {
  if (!input.startTime || !input.endTime || input.maxTotalMintableByWallet === 0) {
    if (input.allowListConfigured || input.signedMintConfigured || input.tokenGatedConfigured) {
      return "This stage requires external authorization and cannot be constructed from public on-chain state alone.";
    }
    return "No public SeaDrop stage is configured for this contract.";
  }
  if (input.feeRecipient === ZeroAddress) {
    return "The public stage restricts fee recipients but none could be selected from on-chain state.";
  }
  return undefined;
}

function stageStatus(now: number, startTime: number, endTime: number): StageStatus {
  if (now < startTime) return "Upcoming";
  if (now > endTime) return "Ended";
  return "Live";
}
