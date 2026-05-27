import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { IGraphClient } from "../types.js";

const responseFormatSchema = z
  .enum(["json", "markdown"])
  .optional()
  .describe("Formato de salida: 'markdown' (por defecto) o 'json'");

export function registerTeamTools(server: McpServer, graph: IGraphClient): void {
  server.registerTool(
    "teams_list_teams",
    {
      title: "List Teams",
      description:
        "Lista todos los equipos de Microsoft Teams a los que pertenece el usuario autenticado. " +
        "Usa los IDs devueltos con el resto de herramientas teams_*.",
      inputSchema: { response_format: responseFormatSchema },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ response_format = "markdown" }) => {
      const { value: teams } = await graph.listJoinedTeams();

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(teams, null, 2) }] };
      }

      const lines = [`# Equipos (${teams.length})\n`];
      for (const t of teams) {
        lines.push(`## ${t.displayName}`);
        lines.push(`- **ID**: \`${t.id}\``);
        if (t.description) lines.push(`- **Descripción**: ${t.description}`);
        lines.push("");
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  server.registerTool(
    "teams_list_channels",
    {
      title: "List Channels",
      description:
        "Lista los canales de un equipo de Teams. " +
        "Usa los IDs de canal con teams_list_files para navegar por los archivos.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo (de teams_list_teams)"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ team_id, response_format = "markdown" }) => {
      const { value: channels } = await graph.listChannels(team_id);

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(channels, null, 2) }] };
      }

      const lines = [`# Canales (${channels.length})\n`];
      for (const ch of channels) {
        lines.push(`## ${ch.displayName}`);
        lines.push(`- **ID**: \`${ch.id}\``);
        if (ch.membershipType) lines.push(`- **Tipo**: ${ch.membershipType}`);
        if (ch.description) lines.push(`- **Descripción**: ${ch.description}`);
        lines.push("");
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // Herramienta para obtener el perfil del usuario autenticado /
  // Tool to get the authenticated user's profile
  server.registerTool(
    "graph_get_current_user",
    {
      title: "Get Current User",
      description:
        "Devuelve el perfil del usuario autenticado en Microsoft Graph: id, displayName, mail y userPrincipalName. " +
        "Usa displayName como w:author en Track Changes de documentos Word.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async () => {
      const user = await graph.getCurrentUser();
      const lines = [
        `# Usuario autenticado`,
        `- **Nombre**: ${user.displayName}`,
        `- **ID**: \`${user.id}\``,
        `- **Email**: ${user.mail ?? user.userPrincipalName ?? "—"}`,
        `- **UPN**: ${user.userPrincipalName ?? "—"}`,
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );
}
