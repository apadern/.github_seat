import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { IGraphClient, DriveItem } from "../types.js";

const responseFormatSchema = z
  .enum(["json", "markdown"])
  .optional()
  .describe("Formato de salida: 'markdown' (por defecto) o 'json'");

const TEXT_MIME_PREFIXES = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/typescript",
  "application/yaml",
  "application/x-yaml",
];

function isTextFile(mimeType: string): boolean {
  return TEXT_MIME_PREFIXES.some((p) => mimeType.startsWith(p));
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatItem(item: DriveItem): string {
  const icon = item.folder ? "📁" : "📄";
  const type = item.folder
    ? `Carpeta (${item.folder.childCount} elementos)`
    : item.file?.mimeType ?? "Archivo";
  return [
    `### ${icon} ${item.name}`,
    `- **ID**: \`${item.id}\``,
    `- **Tipo**: ${type}`,
    `- **Tamaño**: ${formatSize(item.size)}`,
    `- **Modificado**: ${new Date(item.lastModifiedDateTime).toLocaleString()}`,
    `- **URL**: ${item.webUrl}`,
  ].join("\n");
}

export function registerFileTools(server: McpServer, graph: IGraphClient): void {
  server.registerTool(
    "teams_list_files",
    {
      title: "List Files",
      description:
        "Lista archivos y carpetas en la pestaña Archivos de un canal de Teams o dentro de una subcarpeta. " +
        "Proporciona channel_id para el raíz del canal, o folder_id para una subcarpeta.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        channel_id: z.string().optional().describe("ID del canal (requerido si no se indica folder_id)"),
        folder_id: z.string().optional().describe("ID de carpeta (tiene prioridad sobre channel_id)"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ team_id, channel_id, folder_id, response_format = "markdown" }) => {
      let rootId = folder_id;
      if (!rootId) {
        if (!channel_id) throw new Error("Indica channel_id o folder_id.");
        const root = await graph.getChannelFilesFolder(team_id, channel_id);
        rootId = root.id;
      }

      const { value: items } = await graph.listFolderChildren(team_id, rootId);

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }
      if (items.length === 0) {
        return { content: [{ type: "text", text: "_La carpeta está vacía._" }] };
      }

      const folders = items.filter((i) => i.folder);
      const files = items.filter((i) => !i.folder);
      const sections: string[] = [`# Archivos (${items.length})\n`];
      if (folders.length) { sections.push("## Carpetas\n"); sections.push(...folders.map((i) => formatItem(i) + "\n")); }
      if (files.length) { sections.push("## Archivos\n"); sections.push(...files.map((i) => formatItem(i) + "\n")); }
      return { content: [{ type: "text", text: sections.join("\n") }] };
    }
  );

  server.registerTool(
    "teams_read_file",
    {
      title: "Read File",
      description:
        "Lee el contenido de texto de un fichero almacenado en Teams (SharePoint). " +
        "Los ficheros binarios (imágenes, documentos Office) no se pueden leer como texto.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        item_id: z.string().describe("ID del fichero (de teams_list_files)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ team_id, item_id }) => {
      const item = await graph.getItem(team_id, item_id);

      if (item.folder) throw new Error("El elemento indicado es una carpeta, no un fichero.");

      const mimeType = item.file?.mimeType ?? "";
      if (mimeType && !isTextFile(mimeType)) {
        return {
          content: [{
            type: "text",
            text: `⚠️ El fichero \`${item.name}\` es binario (\`${mimeType}\`) y no puede mostrarse como texto.\n\nÁbrelo directamente: ${item.webUrl}`,
          }],
        };
      }

      const downloadUrl = item["@microsoft.graph.downloadUrl"];
      if (!downloadUrl) throw new Error("URL de descarga no disponible para este fichero.");

      const content = await graph.downloadFileContent(downloadUrl);
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.registerTool(
    "teams_upload_file",
    {
      title: "Upload or Update File",
      description:
        "Sube un nuevo fichero o sobreescribe uno existente en una carpeta de Teams. Máximo ~4 MB.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        parent_id: z.string().describe("ID de la carpeta destino"),
        file_name: z.string().describe("Nombre del fichero con extensión, p.ej. 'notas.md'"),
        content: z.string().describe("Contenido de texto a escribir en el fichero"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ team_id, parent_id, file_name, content }) => {
      const item = await graph.uploadFile(team_id, parent_id, file_name, content);
      return {
        content: [{
          type: "text",
          text: `✅ **${item.name}** subido correctamente.\n- **ID**: \`${item.id}\`\n- **Tamaño**: ${formatSize(item.size)}\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  server.registerTool(
    "teams_get_file_info",
    {
      title: "Get File or Folder Info",
      description: "Obtiene los metadatos de un fichero o carpeta: nombre, tamaño, tipo MIME, fecha de modificación y URL.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        item_id: z.string().describe("ID del fichero o carpeta"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ team_id, item_id, response_format = "markdown" }) => {
      const item = await graph.getItem(team_id, item_id);
      if (response_format === "json") {
        const { "@microsoft.graph.downloadUrl": _url, ...rest } = item;
        return { content: [{ type: "text", text: JSON.stringify(rest, null, 2) }] };
      }
      return { content: [{ type: "text", text: formatItem(item) }] };
    }
  );

  server.registerTool(
    "teams_create_folder",
    {
      title: "Create Folder",
      description: "Crea una nueva carpeta dentro de un área de archivos de Teams. Falla si ya existe una con el mismo nombre.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        parent_id: z.string().describe("ID de la carpeta padre"),
        folder_name: z.string().min(1).describe("Nombre de la nueva carpeta"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ team_id, parent_id, folder_name }) => {
      const item = await graph.createFolder(team_id, parent_id, folder_name);
      return {
        content: [{
          type: "text",
          text: `✅ Carpeta **${item.name}** creada.\n- **ID**: \`${item.id}\`\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  server.registerTool(
    "teams_delete_file",
    {
      title: "Delete File or Folder",
      description:
        "Elimina permanentemente un fichero o carpeta de un canal de Teams (se mueve a la papelera de SharePoint). " +
        "Eliminar una carpeta borra todo su contenido.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        item_id: z.string().describe("ID del fichero o carpeta a eliminar"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    async ({ team_id, item_id }) => {
      await graph.deleteItem(team_id, item_id);
      return { content: [{ type: "text", text: `✅ Elemento \`${item_id}\` movido a la papelera.` }] };
    }
  );

  server.registerTool(
    "teams_move_file",
    {
      title: "Move or Rename File",
      description: "Mueve un fichero/carpeta a otra carpeta, lo renombra, o ambas cosas a la vez.",
      inputSchema: {
        team_id: z.string().describe("ID del equipo"),
        item_id: z.string().describe("ID del fichero o carpeta"),
        new_parent_id: z.string().optional().describe("ID de la carpeta destino (omitir para no mover)"),
        new_name: z.string().optional().describe("Nuevo nombre (omitir para no renombrar)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ team_id, item_id, new_parent_id, new_name }) => {
      if (!new_parent_id && !new_name) throw new Error("Indica new_parent_id, new_name o ambos.");
      const patch: Record<string, unknown> = {};
      if (new_parent_id) patch.parentReference = { id: new_parent_id };
      if (new_name) patch.name = new_name;
      const item = await graph.patchItem(team_id, item_id, patch);
      return {
        content: [{
          type: "text",
          text: `✅ Elemento actualizado.\n- **Nombre**: ${item.name}\n- **ID**: \`${item.id}\`\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );
}
