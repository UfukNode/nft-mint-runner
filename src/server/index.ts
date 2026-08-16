import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiRouter } from "./api.js";
import { redactText } from "../core/secrets.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../../public");
const port = Number.parseInt(process.env.PORT || "3000", 10);
const codespaces = Boolean(process.env.CODESPACES || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN);
const host = process.env.HOST || (codespaces ? "0.0.0.0" : "127.0.0.1");

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

app.listen(port, host, () => {
  const localUrl = `http://localhost:${port}`;
  console.log("");
  console.log("SeaDrop Mint Tool running");
  console.log("");
  console.log(`Local: ${localUrl}`);
  if (codespaces) {
    console.log("Codespaces: open the forwarded port from the Ports tab.");
  }
  console.log("");
});

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
    if ((allowedHosts.has(parsed.hostname) || isCodespaces) && parsed.port === String(port)) {
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
