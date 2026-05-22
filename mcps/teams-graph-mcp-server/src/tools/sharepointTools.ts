import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { extname } from "path";
import type { IGraphClient, DriveItem, Drive, Site } from "../types.js";
import { DEFAULT_SHAREPOINT_HOSTNAME, DEFAULT_SHAREPOINT_SITE_PATH } from "../constants.js";
import { extractDocxText } from "../utils/docxExtractor.js";

// Mapa de extensiones a tipos MIME comunes /
// Extension-to-MIME map for common file types
const MIME_MAP: Record<string, string> = {
  ".txt": "text/plain", ".md": "text/markdown", ".html": "text/html", ".htm": "text/html",
  ".css": "text/css", ".csv": "text/csv", ".xml": "text/xml", ".json": "application/json",
  ".js": "application/javascript", ".ts": "application/typescript", ".yaml": "application/yaml",
  ".yml": "application/yaml", ".pdf": "application/pdf", ".zip": "application/zip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".doc": "application/msword", ".xls": "application/vnd.ms-excel",
  ".ppt": "application/vnd.ms-powerpoint",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".mp4": "video/mp4", ".mp3": "audio/mpeg",
};

function getMimeType(fileName: string): string {
  return MIME_MAP[extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

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
  "application/csv",
];

function isTextMime(mimeType: string): boolean {
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

function formatSite(site: Site): string {
  return [
    `## 🏢 ${site.displayName}`,
    `- **ID**: \`${site.id}\``,
    `- **Nombre**: ${site.name}`,
    `- **URL**: ${site.webUrl}`,
    site.description ? `- **Descripción**: ${site.description}` : "",
  ].filter(Boolean).join("\n");
}

function formatDrive(drive: Drive): string {
  return [
    `### 📚 ${drive.name}`,
    `- **ID**: \`${drive.id}\``,
    `- **Tipo**: ${drive.driveType}`,
    `- **URL**: ${drive.webUrl}`,
    drive.description ? `- **Descripción**: ${drive.description}` : "",
  ].filter(Boolean).join("\n");
}

export function registerSharepointTools(server: McpServer, graph: IGraphClient): void {

  // ─── 1. Obtener info del sitio ─────────────────────────────────────────────

  server.registerTool(
    "sharepoint_get_site",
    {
      title: "Get SharePoint Site",
      description:
        "Obtiene la información de un sitio SharePoint (ID, nombre, URL). " +
        `Si no se indican parámetros, usa el sitio por defecto: ${DEFAULT_SHAREPOINT_HOSTNAME}/${DEFAULT_SHAREPOINT_SITE_PATH}.`,
      inputSchema: {
        hostname: z.string().optional().describe(`Hostname de SharePoint (por defecto: ${DEFAULT_SHAREPOINT_HOSTNAME})`),
        site_path: z.string().optional().describe(`Ruta relativa del sitio (por defecto: ${DEFAULT_SHAREPOINT_SITE_PATH})`),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ hostname, site_path, response_format = "markdown" }) => {
      const host = hostname ?? DEFAULT_SHAREPOINT_HOSTNAME;
      const path = site_path ?? DEFAULT_SHAREPOINT_SITE_PATH;
      const site = await graph.getSite(host, path);

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(site, null, 2) }] };
      }
      return { content: [{ type: "text", text: `# Sitio SharePoint\n\n${formatSite(site)}` }] };
    }
  );

  // ─── 2. Listar bibliotecas de documentos (drives) ─────────────────────────

  server.registerTool(
    "sharepoint_list_drives",
    {
      title: "List Document Libraries",
      description:
        "Lista las bibliotecas de documentos (drives) disponibles en un sitio SharePoint. " +
        "Los IDs de drive se usan con sharepoint_list_items.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint (de sharepoint_get_site)"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ site_id, response_format = "markdown" }) => {
      const { value: drives } = await graph.listSiteDrives(site_id);

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(drives, null, 2) }] };
      }
      const lines = [`# Bibliotecas de documentos (${drives.length})\n`];
      drives.forEach((d) => lines.push(formatDrive(d) + "\n"));
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // ─── 3. Listar elementos de una carpeta ───────────────────────────────────

  server.registerTool(
    "sharepoint_list_items",
    {
      title: "List SharePoint Folder Items",
      description:
        "Lista archivos y carpetas en el raíz del drive de un sitio o dentro de una subcarpeta. " +
        "Si no se indica folder_id se muestra el raíz del drive del sitio.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        folder_id: z.string().optional().describe("ID de carpeta (omitir para la raíz del drive)"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ site_id, folder_id, response_format = "markdown" }) => {
      // Obtener el ID raíz si no se indica carpeta / Get root ID if no folder indicated
      let rootId = folder_id;
      if (!rootId) {
        const root = await graph.getSiteDriveRoot(site_id);
        rootId = root.id;
      }

      const { value: items } = await graph.listSiteChildren(site_id, rootId);

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

  // ─── 4. Leer contenido de un fichero ──────────────────────────────────────

  server.registerTool(
    "sharepoint_read_file",
    {
      title: "Read SharePoint File",
      description:
        "Lee el contenido de texto de un fichero en SharePoint. " +
        "Los ficheros binarios (Office, imágenes) devuelven la URL de descarga en lugar del contenido.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        item_id: z.string().describe("ID del fichero (de sharepoint_list_items)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ site_id, item_id }) => {
      const item = await graph.getSiteItem(site_id, item_id);

      if (item.folder) throw new Error("El elemento indicado es una carpeta, no un fichero.");

      const mimeType = item.file?.mimeType ?? "";
      // Ficheros binarios no se pueden leer como texto / Binary files cannot be read as text
      if (mimeType && !isTextMime(mimeType)) {
        return {
          content: [{
            type: "text",
            text: [
              `⚠️ El fichero \`${item.name}\` es binario (\`${mimeType}\`).`,
              `Usa la URL para descargarlo o abrirlo directamente: ${item.webUrl}`,
              item["@microsoft.graph.downloadUrl"]
                ? `\nURL de descarga directa: ${item["@microsoft.graph.downloadUrl"]}`
                : "",
            ].filter(Boolean).join("\n"),
          }],
        };
      }

      const downloadUrl = item["@microsoft.graph.downloadUrl"];
      if (!downloadUrl) throw new Error("URL de descarga no disponible para este fichero.");

      const content = await graph.downloadFileContent(downloadUrl);
      return { content: [{ type: "text", text: content }] };
    }
  );

  // ─── 5. Subir fichero de texto ────────────────────────────────────────────

  server.registerTool(
    "sharepoint_upload_file",
    {
      title: "Upload or Update Text File",
      description:
        "Sube un nuevo fichero de texto o sobreescribe uno existente en una carpeta de SharePoint. " +
        "Para ficheros binarios (docx, xlsx, imágenes) usa sharepoint_upload_local_file.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        parent_id: z.string().describe("ID de la carpeta destino"),
        file_name: z.string().describe("Nombre del fichero con extensión, p.ej. 'notas.md'"),
        content: z.string().describe("Contenido de texto a escribir en el fichero"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ site_id, parent_id, file_name, content }) => {
      // Inferir tipo MIME desde la extensión / Infer MIME type from extension
      const mimeType = getMimeType(file_name);
      const item = await graph.uploadSiteFile(site_id, parent_id, file_name, content, mimeType);
      return {
        content: [{
          type: "text",
          text: `✅ **${item.name}** subido correctamente.\n- **ID**: \`${item.id}\`\n- **Tamaño**: ${formatSize(item.size)}\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  // ─── 6. Subir fichero local (binario o texto) ─────────────────────────────

  server.registerTool(
    "sharepoint_upload_local_file",
    {
      title: "Upload Local File to SharePoint",
      description:
        "Lee un fichero del sistema de ficheros local y lo sube a una carpeta de SharePoint. " +
        "Soporta cualquier tipo de fichero: texto, docx, xlsx, imágenes, PDF, etc. Máximo ~4 MB.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        parent_id: z.string().describe("ID de la carpeta destino en SharePoint"),
        local_path: z.string().describe("Ruta absoluta al fichero local a subir"),
        file_name: z.string().optional().describe("Nombre destino en SharePoint (por defecto: nombre del fichero local)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ site_id, parent_id, local_path, file_name }) => {
      // Leer el fichero local como buffer binario / Read local file as binary buffer
      let buffer: Buffer;
      try {
        buffer = readFileSync(local_path);
      } catch (err) {
        throw new Error(`No se pudo leer el fichero local '${local_path}': ${String(err)}`);
      }

      const destName = file_name ?? local_path.split("/").pop() ?? "file";
      const mimeType = getMimeType(destName);

      const item = await graph.uploadSiteFile(site_id, parent_id, destName, buffer, mimeType);
      return {
        content: [{
          type: "text",
          text: `✅ **${item.name}** subido correctamente desde \`${local_path}\`.\n- **ID**: \`${item.id}\`\n- **Tamaño**: ${formatSize(item.size)}\n- **Tipo**: ${mimeType}\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  // ─── 7. Crear carpeta ─────────────────────────────────────────────────────

  server.registerTool(
    "sharepoint_create_folder",
    {
      title: "Create Folder in SharePoint",
      description: "Crea una nueva carpeta en un sitio SharePoint. Falla si ya existe una carpeta con el mismo nombre.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        parent_id: z.string().describe("ID de la carpeta padre"),
        folder_name: z.string().min(1).describe("Nombre de la nueva carpeta"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    },
    async ({ site_id, parent_id, folder_name }) => {
      const item = await graph.createSiteFolder(site_id, parent_id, folder_name);
      return {
        content: [{
          type: "text",
          text: `✅ Carpeta **${item.name}** creada.\n- **ID**: \`${item.id}\`\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  // ─── 8. Eliminar elemento ─────────────────────────────────────────────────

  server.registerTool(
    "sharepoint_delete_item",
    {
      title: "Delete SharePoint Item",
      description:
        "Elimina un fichero o carpeta de SharePoint (se mueve a la papelera de reciclaje del sitio). " +
        "Eliminar una carpeta borra todo su contenido.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        item_id: z.string().describe("ID del fichero o carpeta a eliminar"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    async ({ site_id, item_id }) => {
      await graph.deleteSiteItem(site_id, item_id);
      return { content: [{ type: "text", text: `✅ Elemento \`${item_id}\` movido a la papelera de SharePoint.` }] };
    }
  );

  // ─── 9. Mover / renombrar elemento ────────────────────────────────────────

  server.registerTool(
    "sharepoint_move_item",
    {
      title: "Move or Rename SharePoint Item",
      description: "Mueve un fichero/carpeta a otra ubicación, lo renombra, o ambas cosas a la vez.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        item_id: z.string().describe("ID del fichero o carpeta"),
        new_parent_id: z.string().optional().describe("ID de la carpeta destino (omitir para no mover)"),
        new_name: z.string().optional().describe("Nuevo nombre (omitir para no renombrar)"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ site_id, item_id, new_parent_id, new_name }) => {
      if (!new_parent_id && !new_name) throw new Error("Indica new_parent_id, new_name o ambos.");
      const patch: Record<string, unknown> = {};
      if (new_parent_id) patch.parentReference = { id: new_parent_id };
      if (new_name) patch.name = new_name;
      const item = await graph.patchSiteItem(site_id, item_id, patch);
      return {
        content: [{
          type: "text",
          text: `✅ Elemento actualizado.\n- **Nombre**: ${item.name}\n- **ID**: \`${item.id}\`\n- **URL**: ${item.webUrl}`,
        }],
      };
    }
  );

  // ─── 10. Buscar ficheros ──────────────────────────────────────────────────

  server.registerTool(
    "sharepoint_search_files",
    {
      title: "Search SharePoint Files",
      description: "Busca ficheros y carpetas en un sitio SharePoint usando texto libre.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint"),
        query: z.string().min(1).describe("Texto a buscar (nombre, contenido, metadatos)"),
        response_format: responseFormatSchema,
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ site_id, query, response_format = "markdown" }) => {
      const { value: items } = await graph.searchSiteFiles(site_id, query);

      if (response_format === "json") {
        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }
      if (items.length === 0) {
        return { content: [{ type: "text", text: `_No se encontraron resultados para "${query}"._` }] };
      }
      const lines = [`# Resultados para "${query}" (${items.length})\n`];
      items.forEach((i) => lines.push(formatItem(i) + "\n"));
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // ─── 11. Leer documento Word (.docx) ─────────────────────────────────────

  server.registerTool(
    "sharepoint_read_docx",
    {
      title: "Read Word Document from SharePoint",
      description:
        "Extrae el texto completo de un documento Word (.docx) almacenado en SharePoint y lo devuelve en formato Markdown. " +
        "Usa item_path para localizar el fichero por su ruta relativa al drive (p.ej. 'Carpeta/subcarpeta/fichero.docx'), " +
        "o item_id si ya tienes el ID del fichero. " +
        "La extracción usa Python (zipfile + lxml) sin dependencias externas.",
      inputSchema: {
        site_id: z.string().describe("ID del sitio SharePoint (de sharepoint_get_site)"),
        item_id: z.string().optional().describe("ID del fichero .docx (de sharepoint_list_items)"),
        item_path: z.string().optional().describe("Ruta relativa desde la raíz del drive, p.ej. \"Carpeta/Nombre del fichero.docx\""),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ site_id, item_id, item_path }) => {
      if (!item_id && !item_path) throw new Error("Indica item_id o item_path.");

      // Obtener metadatos + URL de descarga pre-autenticada /
      // Get metadata + pre-authenticated download URL
      const item = item_id
        ? await graph.getSiteItem(site_id, item_id)
        : await graph.getSiteItemByPath(site_id, item_path!);

      const downloadUrl = item["@microsoft.graph.downloadUrl"];
      if (!downloadUrl) throw new Error(`URL de descarga no disponible para '${item.name}'. Verifica que el fichero existe y que tienes permisos.`);

      // Descargar el binario y extraer texto con Python/lxml /
      // Download binary and extract text with Python/lxml
      const buffer = await graph.downloadFileBuffer(downloadUrl);
      const text = extractDocxText(buffer);

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return {
        content: [{
          type: "text",
          text: `# ${item.name}\n\n${text}\n\n---\n_${wordCount} palabras extraídas · ${new Date(item.lastModifiedDateTime).toLocaleDateString()}_`,
        }],
      };
    }
  );
}
