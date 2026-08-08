import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual, createHash } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createWhoopServer, disconnectOnExit } from "./server";

const secret = process.env.MCP_HTTP_SECRET;
if (!secret || secret.length < 24) {
  throw new Error(
    "MCP_HTTP_SECRET must be set (24+ chars) — it is the only thing keeping " +
      "this endpoint private. Generate one with: openssl rand -hex 24",
  );
}
const port = Number(process.env.MCP_HTTP_PORT ?? 8788);

function pathMatches(pathname: string): boolean {
  const expected = createHash("sha256").update(`/mcp/${secret}`).digest();
  const actual = createHash("sha256").update(pathname).digest();
  return timingSafeEqual(expected, actual);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if (!pathMatches(pathname)) {
    res.writeHead(404, { "content-type": "application/json" }).end(
      JSON.stringify({ error: "not found" }),
    );
    return;
  }

  let body: unknown;
  if (req.method === "POST") {
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      res.writeHead(400, { "content-type": "application/json" }).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        }),
      );
      return;
    }
  }

  const server = createWhoopServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

const httpServer = createHttpServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error("whoop-data http request failed:", error);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" }).end(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        }),
      );
    }
  });
});

disconnectOnExit();

httpServer.listen(port, () => {
  console.error(`whoop-data MCP server listening on http://localhost:${port}/mcp/<secret>`);
});
