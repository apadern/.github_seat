import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AuthProvider } from "./auth/authProvider.js";
import { GraphClient } from "./services/graphClient.js";
import { MockGraphClient } from "./mockGraphClient.js";
import { registerTeamTools } from "./tools/teamTools.js";
import { registerFileTools } from "./tools/fileTools.js";
import { registerSharepointTools } from "./tools/sharepointTools.js";
import type { IGraphClient } from "./types.js";

const IS_MOCK = process.env.TEAMS_MCP_MOCK === "true";
const CLIENT_ID = process.env.TEAMS_MCP_CLIENT_ID;
// Tenant por defecto: "common" permite cuentas personales y de organización /
// Default tenant: "common" allows both personal and organizational accounts
const TENANT_ID = process.env.TEAMS_MCP_TENANT_ID ?? "common";

let graph: IGraphClient;

if (IS_MOCK) {
  console.error("[teams-graph-mcp] Modo MOCK activo — datos ficticios, sin conexión a Azure.");
  graph = new MockGraphClient();
} else {
  if (!CLIENT_ID) {
    console.error("[teams-graph-mcp] ERROR: La variable TEAMS_MCP_CLIENT_ID es obligatoria.");
    console.error("[teams-graph-mcp] Registra una app en Azure AD y configura el client ID en .vscode/mcp.json.");
    process.exit(1);
  }
  const auth = new AuthProvider(CLIENT_ID, TENANT_ID);
  graph = new GraphClient(auth);
  console.error(`[teams-graph-mcp] Client ID: ${CLIENT_ID}`);
  console.error(`[teams-graph-mcp] Tenant: ${TENANT_ID}`);
}

const server = new McpServer({
  name: "teams-graph-mcp-server",
  version: "1.0.0",
});

registerTeamTools(server, graph);
registerFileTools(server, graph);
registerSharepointTools(server, graph);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = IS_MOCK ? "MOCK" : "real";
  console.error(`Teams Graph MCP Server iniciado (stdio, modo ${mode})`);
}

main().catch((err: unknown) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
