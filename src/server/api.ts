import crypto from "node:crypto";
import express from "express";
import { JsonRpcProvider } from "ethers";
import { CHAINS, getChain, listChains, rpcUrlsFor, splitRpcList } from "../core/chains.js";
import { parseNftTarget } from "../core/target.js";
import { classifyRpcUrls, healthyReadEndpoint, broadcastEndpoints } from "../core/rpc.js";
import { inspectSeaDropPublicMint, readCollectionLabel, totalMintValue } from "../core/seadrop.js";
import { validateGas } from "../core/gas.js";
import { validateQuantity } from "../core/quantity.js";
import { calculateAffordability } from "../core/affordability.js";
import { walletFromPrivateKey, publicWallet, refreshWalletBalances } from "../core/wallets.js";
import { prepareMintTransaction } from "../core/transactions.js";
import { chainView, dropView, gasView, resultView, rpcView, walletView } from "./serializers.js";
import { SessionStore } from "./session-store.js";
import { runBroadcast } from "./executor.js";

const store = new SessionStore();

export function createApiRouter(): express.Router {
  const router = express.Router();

  router.get("/networks", (_request, response) => {
    response.json({ networks: listChains().map(chainView) });
  });

  router.post("/inspect", async (request, response, next) => {
    try {
      const chain = getChain(String(request.body.chainKey ?? ""));
      const target = parseNftTarget(String(request.body.target ?? ""), chain);
      if (target.kind === "opensea-collection") {
        response.status(422).json({
          error: "OpenSea collection slugs cannot be resolved reliably without an authenticated API. Paste the NFT contract address instead.",
          target
        });
        return;
      }

      const customUrls = splitRpcList(String(request.body.rpcUrls ?? ""));
      const endpoints = await classifyRpcUrls([...customUrls, ...rpcUrlsFor(chain)], chain);
      const readEndpoint = healthyReadEndpoint(endpoints);
      if (!readEndpoint) {
        response.status(422).json({ error: "No read-capable RPC endpoint is connected to the selected chain.", rpcs: endpoints.map(rpcView) });
        return;
      }

      const provider = new JsonRpcProvider(readEndpoint.url, chain.chainId, { staticNetwork: true });
      const [drop, label] = await Promise.all([
        inspectSeaDropPublicMint(provider, chain, target.contractAddress),
        readCollectionLabel(provider, target.contractAddress)
      ]);
      const session = store.create({ chain, provider, readRpcUrl: readEndpoint.url, rpcEndpoints: endpoints, drop, label });
      const feeData = await provider.getFeeData().catch(() => undefined);

      response.json({
        sessionId: session.id,
        chain: chainView(chain),
        target,
        drop: dropView(drop, chain, label),
        rpcs: endpoints.map(rpcView),
        baseFeeWei: feeData?.gasPrice?.toString()
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/rpcs", async (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      const urls = splitRpcList(String(request.body.rpcUrls ?? ""));
      const endpoints = await classifyRpcUrls([...urls, ...rpcUrlsFor(session.chain)], session.chain);
      const readEndpoint = healthyReadEndpoint(endpoints);
      if (readEndpoint && readEndpoint.url !== session.readRpcUrl) {
        session.provider = new JsonRpcProvider(readEndpoint.url, session.chain.chainId, { staticNetwork: true });
        session.readRpcUrl = readEndpoint.url;
      }
      session.rpcEndpoints = endpoints;
      response.json({ rpcs: endpoints.map(rpcView), broadcastCount: broadcastEndpoints(endpoints).length });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/wallets", async (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      const privateKey = String(request.body.privateKey ?? "");
      const id = crypto.randomBytes(12).toString("base64url");
      const wallet = await walletFromPrivateKey(id, privateKey, session.provider);
      if (session.wallets.some((item) => item.address === wallet.address)) {
        response.status(409).json({ error: "Wallet is already added." });
        return;
      }
      session.wallets.push(wallet);
      response.json({ wallet: walletView(publicWallet(wallet), session.chain), wallets: session.wallets.map((item) => walletView(publicWallet(item), session.chain)) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/sessions/:sessionId/wallets/:walletId", (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      session.wallets = session.wallets.filter((wallet) => wallet.id !== request.params.walletId);
      response.json({ wallets: session.wallets.map((item) => walletView(publicWallet(item), session.chain)) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/sessions/:sessionId/wallets", (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      session.wallets = [];
      response.json({ wallets: [] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/validate", async (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      if (!session.drop) throw new Error("Analyze a mint target first.");
      if (session.drop.status === "Unsupported") {
        throw new Error(session.drop.unsupportedReason || "This public mint is unsupported.");
      }
      if (session.drop.status === "Ended") {
        throw new Error("The public SeaDrop stage has already ended.");
      }
      session.wallets = await refreshWalletBalances(session.wallets, session.provider);
      const block = await session.provider.getBlock("latest");
      const baseFeeWei = block?.baseFeePerGas ?? (await session.provider.getFeeData()).gasPrice ?? 0n;
      const quantity = validateQuantity(request.body.quantity, session.drop.maxTotalMintableByWallet);
      const gas = validateGas({
        maxFeeGwei: String(request.body.maxFeeGwei ?? ""),
        priorityFeeGwei: String(request.body.priorityFeeGwei ?? ""),
        gasLimit: String(request.body.gasLimit ?? ""),
        baseFeeWei
      });
      session.quantity = quantity;
      session.gas = gas;
      session.state = "READY";
      const mintValueWei = totalMintValue(session.drop.mintPriceWei, quantity);
      const wallets = session.wallets.map((wallet) => {
        const affordability = calculateAffordability({
          balanceWei: wallet.balanceWei,
          mintValueWei,
          gasLimit: gas.gasLimit,
          maxFeePerGas: gas.maxFeePerGas
        });
        return {
          ...walletView(publicWallet(wallet), session.chain),
          mintValueWei: mintValueWei.toString(),
          gasReservationWei: affordability.gasReservationWei.toString(),
          requiredWei: affordability.requiredWei.toString(),
          ready: affordability.ready,
          status: affordability.ready ? "Ready" : "Insufficient balance",
          shortfallWei: affordability.shortfallWei.toString()
        };
      });
      response.json({
        state: session.state,
        quantity,
        totalNfts: quantity * session.wallets.length,
        baseFeeWei: baseFeeWei.toString(),
        gas: gasView(session),
        wallets
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/prepare", async (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      if (!session.drop || !session.gas || !session.quantity) throw new Error("Validate mint settings before preparing.");
      session.state = "PREPARING";
      const mintValueWei = totalMintValue(session.drop.mintPriceWei, session.quantity);
      const readyWallets = session.wallets.filter((wallet) =>
        calculateAffordability({
          balanceWei: wallet.balanceWei,
          mintValueWei,
          gasLimit: session.gas!.gasLimit,
          maxFeePerGas: session.gas!.maxFeePerGas
        }).ready
      );
      session.prepared = await Promise.all(
        readyWallets.map((wallet) =>
          prepareMintTransaction({
            provider: session.provider,
            chain: session.chain,
            wallet,
            drop: session.drop!,
            quantity: session.quantity!,
            gas: session.gas!
          })
        )
      );
      session.results = session.prepared.map((tx) => ({
        walletId: tx.walletId,
        address: tx.address,
        status: "Prepared",
        txHash: tx.hash,
        explorerUrl: `${session.chain.explorerBaseUrl}/tx/${tx.hash}`
      }));
      session.state = "PREPARED";
      response.json({ state: session.state, preparedCount: session.prepared.length, results: session.results.map(resultView) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/arm", async (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      if (!session.drop || session.prepared.length === 0) throw new Error("Prepare transactions before arming.");
      session.refreshGasBeforeBroadcast = true;
      const nowMs = Date.now();
      const startMs = session.drop.startTime * 1000;
      const endMs = session.drop.endTime * 1000;
      if (nowMs > endMs) {
        throw new Error("The public SeaDrop stage has already ended.");
      }
      session.state = "ARMED";
      const delayMs = nowMs < startMs ? startMs - nowMs : 0;
      session.state = delayMs > 0 ? "WAITING" : "BROADCASTING";
      session.timer = setTimeout(() => {
        void runBroadcast(session).catch((error) => {
          session.state = "FAILED";
          session.results = session.prepared.map((tx) => ({
            walletId: tx.walletId,
            address: tx.address,
            status: "Rejected",
            txHash: tx.hash,
            message: error instanceof Error ? error.message : "Broadcast failed"
          }));
          session.prepared = [];
          session.wallets = [];
        });
      }, delayMs);
      response.json({ state: session.state, executionTime: new Date(nowMs + delayMs).toISOString(), delayMs });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sessions/:sessionId/cancel", (request, response, next) => {
    try {
      const session = store.cancel(request.params.sessionId);
      response.json({ state: session.state });
    } catch (error) {
      next(error);
    }
  });

  router.get("/sessions/:sessionId/status", (request, response, next) => {
    try {
      const session = store.get(request.params.sessionId);
      response.json({
        state: session.state,
        chain: chainView(session.chain),
        drop: session.drop ? dropView(session.drop, session.chain, session.label) : undefined,
        wallets: session.wallets.map((wallet) => walletView(publicWallet(wallet), session.chain)),
        quantity: session.quantity,
        gas: gasView(session),
        preparedCount: session.prepared.length,
        results: session.results.map(resultView),
        expiresAt: new Date(session.expiresAt).toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
