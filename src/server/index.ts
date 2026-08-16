import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import express from "express";
import { createApiRouter } from "./api.js";
import { redactText } from "../core/secrets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../public");
const configuredPort = Number.parseInt(process.env.PORT || "3000", 10);
const preferredPort = Number.isFinite(configuredPort) ? configuredPort : 3000;
const codespaces = Boolean(process.env.CODESPACES || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN);
const host = process.env.HOST || (codespaces ? "0.0.0.0" : "127.0.0.1");
let activePort = preferredPort;

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use(originGuard);
app.use("/api", createApiRouter());
app.use(
  express.static(publicDir, {
    extensions: ["html"],
    etag: false,
    maxAge: 0,
    setHeaders(response) {
      response.setHeader("Cache-Control", "no-store");
    }
  })
);
app.get("*", (_request, response) => response.sendFile(path.join(publicDir, "index.html")));
app.use(errorHandler);

startServer(preferredPort);

function startServer(port: number): void {
  const server = app.listen(port, host);
  server.once("listening", () => {
    activePort = port;
    printStartup(port);
  });
  server.once("error", (error: NodeJS.ErrnoException) => {
    handleListenError(error, server, port);
  });
}

function handleListenError(error: NodeJS.ErrnoException, server: Server, port: number): void {
  server.close();
  if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
    const nextPort = port + 1;
    console.log(`Port ${port} is already in use. Trying ${nextPort}...`);
    startServer(nextPort);
    return;
  }
  throw error;
}

function printStartup(port: number): void {
  const localUrl = `http://localhost:${port}`;
  console.log("");
  console.log("NFT Mint Runner running");
  console.log("");
  console.log(`Local: ${localUrl}`);
  if (codespaces) {
    console.log("Codespaces: open the forwarded port from the Ports tab.");
  }
  console.log("");
}

function originGuard(request: express.Request, response: express.Response, next: express.NextFunction): void {
  const origin = request.headers.origin;
  if (!origin) {
    next();
    return;
  }
  try {
    const parsed = new URL(origin);
    const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const isCodespaces = parsed.hostname.endsWith(".app.github.dev");
    if ((allowedHosts.has(parsed.hostname) || isCodespaces) && parsed.port === String(activePort)) {
      next();
      return;
    }
  } catch {
    // Fall through to rejection.
  }
  response.status(403).json({ error: "Origin is not allowed for this local server." });
}

function errorHandler(
  error: unknown,
  _request: express.Request,
  response: express.Response,
  _next: express.NextFunction
): void {
  const message = redactText(error instanceof Error ? error.message : "Request failed.");
  response.status(400).json({ error: message });
}
