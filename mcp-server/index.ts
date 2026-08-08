import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWhoopServer, disconnectOnExit } from "./server";

async function main() {
  const transport = new StdioServerTransport();
  await createWhoopServer().connect(transport);
  console.error("whoop-data MCP server running on stdio");
}

disconnectOnExit();

main().catch((error) => {
  console.error("MCP server failed to start:", error);
  process.exit(1);
});
