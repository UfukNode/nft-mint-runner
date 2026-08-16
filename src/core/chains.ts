export type ChainKey = "ethereum" | "base" | "robinhood";

export type ChainConfig = {
  key: ChainKey;
  name: string;
  chainId: number;
  nativeSymbol: string;
  explorerBaseUrl: string;
  seaDropAddress: string;
  defaultRpcUrls: string[];
  envRpcName: string;
  sendOnlyRpcUrls?: string[];
  providerTemplates?: Array<{ label: string; url: string }>;
  openSeaSlugs: string[];
};

const SEADROP_V1 = "0x00005EA00Ac477B1030CE78506496e8C2dE24bf5";

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: "ethereum",
    name: "Ethereum Mainnet",
    chainId: 1,
    nativeSymbol: "ETH",
    explorerBaseUrl: "https://etherscan.io",
    seaDropAddress: SEADROP_V1,
    defaultRpcUrls: ["https://ethereum.publicnode.com", "https://rpc.ankr.com/eth"],
    envRpcName: "RPC_ETHEREUM",
    openSeaSlugs: ["ethereum", "eth", "mainnet"]
  },
  base: {
    key: "base",
    name: "Base",
    chainId: 8453,
    nativeSymbol: "ETH",
    explorerBaseUrl: "https://basescan.org",
    seaDropAddress: SEADROP_V1,
    defaultRpcUrls: ["https://mainnet.base.org", "https://base.publicnode.com"],
    envRpcName: "RPC_BASE",
    openSeaSlugs: ["base"]
  },
  robinhood: {
    key: "robinhood",
    name: "Robinhood Chain",
    chainId: 4663,
    nativeSymbol: "ETH",
    explorerBaseUrl: "https://robinhoodchain.blockscout.com",
    seaDropAddress: SEADROP_V1,
    defaultRpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
    envRpcName: "RPC_ROBINHOOD",
    openSeaSlugs: ["robinhood", "robinhood-chain"]
  }
};

export function listChains(): ChainConfig[] {
  return Object.values(CHAINS);
}

export function getChain(key: string): ChainConfig {
  const chain = CHAINS[key as ChainKey];
  if (!chain) {
    throw new Error(`Unsupported network: ${key}`);
  }
  return chain;
}

export function rpcUrlsFor(chain: ChainConfig, env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = splitRpcList(env[chain.envRpcName]);
  return uniqueUrls([...configured, ...chain.defaultRpcUrls]);
}

export function splitRpcList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueUrls(urls: string[]): string[] {
  return Array.from(new Set(urls));
}
