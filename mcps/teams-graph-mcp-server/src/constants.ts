export const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

// Scopes en formato corto para MSAL Node (permisos delegados) /
// Short-form scopes for MSAL Node (delegated permissions)
export const GRAPH_SCOPES = [
  "Files.ReadWrite.All",
  "Sites.ReadWrite.All",
  "User.Read",
  "offline_access",
];

export const TOKEN_CACHE_FILE = ".teams-graph-mcp-msal-cache.json";

// Configuración del sitio SharePoint por defecto (SEAT-SquadBTPS124) /
// Default SharePoint site configuration (SEAT-SquadBTPS124)
export const DEFAULT_SHAREPOINT_HOSTNAME = process.env.SHAREPOINT_HOSTNAME ?? "everisgroup.sharepoint.com";
export const DEFAULT_SHAREPOINT_SITE_PATH = process.env.SHAREPOINT_SITE_PATH ?? "sites/SEAT-SquadBTPS124";
