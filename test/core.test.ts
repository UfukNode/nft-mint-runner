import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import http from "node:http";
import { JsonRpcProvider, ZeroAddress } from "ethers";
import { CHAINS, getChain, listChains } from "../src/core/chains.js";
import { parseNftTarget } from "../src/core/target.js";
import { validateGas } from "../src/core/gas.js";
import { validateQuantity } from "../src/core/quantity.js";
import { classifyRpcUrl } from "../src/core/rpc.js";
import { seaDropInterface } from "../src/core/seadrop.js";
import { calculateAffordability } from "../src/core/affordability.js";
import { nextState } from "../src/core/state-machine.js";
import { redactRpcUrl, redactText } from "../src/core/secrets.js";
import { SessionStore } from "../src/server/session-store.js";

describe("chain registry", () => {
  it("contains the required production chains", () => {
    assert.equal(CHAINS.ethereum.chainId, 1);
    assert.equal(CHAINS.base.chainId, 8453);
    assert.equal(CHAINS.robinhood.chainId, 4663);
    assert.equal(listChains().length, 3);
  });

  it("rejects unknown chain keys", () => {
    assert.throws(() => getChain("unknown"), /Unsupported network/);
  });
});

describe("target parsing", () => {
  it("rejects invalid EVM addresses", () => {
    assert.throws(() => parseNftTarget("0xabc", CHAINS.base), /valid OpenSea URL|EVM address/);
  });

  it("parses a raw contract address", () => {
    const parsed = parseNftTarget("0x0000000000000000000000000000000000000001", CHAINS.ethereum);
    assert.equal(parsed.kind, "contract");
    assert.equal(parsed.contractAddress, "0x0000000000000000000000000000000000000001");
  });

  it("parses OpenSea item URLs", () => {
    const parsed = parseNftTarget(
      "https://opensea.io/assets/base/0x0000000000000000000000000000000000000001/42",
      CHAINS.base
    );
    assert.equal(parsed.kind, "opensea-item");
    assert.equal(parsed.tokenId, "42");
  });

  it("detects OpenSea URL chain mismatch", () => {
    assert.throws(
      () => parseNftTarget("https://opensea.io/assets/ethereum/0x0000000000000000000000000000000000000001/1", CHAINS.base),
      /selected network/
    );
  });

  it("handles collection slugs without pretending they are resolved", () => {
    const parsed = parseNftTarget("https://opensea.io/collection/example", CHAINS.ethereum);
    assert.equal(parsed.kind, "opensea-collection");
    assert.equal(parsed.needsContract, true);
  });
});

describe("validation helpers", () => {
  it("validates EIP-1559 gas rules", () => {
    assert.throws(
      () => validateGas({ maxFeeGwei: "0.1", priorityFeeGwei: "0.2", gasLimit: "160000" }),
      /priority fee/i
    );
    assert.throws(
      () => validateGas({ maxFeeGwei: "1", priorityFeeGwei: "0.1", gasLimit: "160000", baseFeeWei: 2_000_000_000n }),
      /base fee/
    );
    const gas = validateGas({ maxFeeGwei: "2", priorityFeeGwei: "0.1", gasLimit: "160000" });
    assert.equal(gas.gasLimit, 160000n);
  });

  it("validates quantity against max-per-wallet", () => {
    assert.equal(validateQuantity("2", 5), 2);
    assert.throws(() => validateQuantity("6", 5), /per-wallet limit/);
    assert.throws(() => validateQuantity("0", 5), /positive/);
  });

  it("calculates max reservation affordability", () => {
    const result = calculateAffordability({
      balanceWei: 20n,
      mintValueWei: 10n,
      gasLimit: 2n,
      maxFeePerGas: 3n
    });
    assert.equal(result.requiredWei, 16n);
    assert.equal(result.ready, true);
  });
});

describe("rpc checks", () => {
  const servers: http.Server[] = [];

  after(() => {
    for (const server of servers) server.close();
  });

  it("detects RPC chain ID mismatch", async () => {
    const server = http.createServer((request, response) => {
      request.resume();
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1" }));
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert(typeof address === "object" && address);
    const endpoint = await classifyRpcUrl(`http://127.0.0.1:${address.port}`, CHAINS.base);
    assert.equal(endpoint.status, "Wrong network");
    assert.equal(endpoint.chainId, 1);
  });
});

describe("SeaDrop ABI", () => {
  it("decodes public drop response values", () => {
    const encoded = seaDropInterface.encodeFunctionResult("getPublicDrop", [
      [100n, 200n, 300n, 4n, 500n, true]
    ]);
    const [drop] = seaDropInterface.decodeFunctionResult("getPublicDrop", encoded);
    assert.equal(BigInt(drop.mintPrice), 100n);
    assert.equal(Number(drop.startTime), 200);
    assert.equal(Number(drop.maxTotalMintableByWallet), 4);
    assert.equal(Boolean(drop.restrictFeeRecipients), true);
  });
});

describe("state machine", () => {
  it("allows expected transitions and rejects impossible ones", () => {
    assert.equal(nextState("READY", "PREPARING"), "PREPARING");
    assert.throws(() => nextState("IDLE", "BROADCASTING"), /Invalid mint state transition/);
  });
});

describe("redaction", () => {
  it("masks RPC secrets and private keys", () => {
    assert.equal(
      redactRpcUrl("https://base-mainnet.g.alchemy.com/v2/abcdefghijklmnopqrstuvwxyz"),
      "https://base-mainnet.g.alchemy.com/v2/redacted"
    );
    assert.match(redactText("key=abc 0x" + "1".repeat(64)), /redacted-private-key/);
  });
});

describe("session expiration", () => {
  it("expires sessions and clears sensitive material", () => {
    const store = new SessionStore();
    const session = store.create({
      chain: CHAINS.ethereum,
      provider: new JsonRpcProvider("http://127.0.0.1:1", 1, { staticNetwork: true }),
      readRpcUrl: "http://127.0.0.1:1",
      rpcEndpoints: [],
      drop: {
        nftContract: ZeroAddress,
        seaDropAddress: CHAINS.ethereum.seaDropAddress,
        mintPriceWei: 0n,
        startTime: 1,
        endTime: 2,
        maxTotalMintableByWallet: 1,
        feeBps: 0,
        restrictFeeRecipients: false,
        feeRecipient: ZeroAddress,
        allowedFeeRecipients: [],
        creatorPayoutAddress: ZeroAddress,
        allowListConfigured: false,
        signedMintConfigured: false,
        tokenGatedConfigured: false,
        status: "Ended",
        source: "on-chain SeaDrop configuration"
      }
    });
    session.expiresAt = Date.now() - 1;
    assert.throws(() => store.get(session.id), /expired/);
  });
});
