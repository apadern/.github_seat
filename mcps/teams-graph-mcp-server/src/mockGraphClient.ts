import type {
  IGraphClient,
  Team,
  Channel,
  Site,
  Drive,
  DriveItem,
  GraphUser,
  GraphListResponse,
} from "./types.js";

const MOCK_TEAMS: Team[] = [
  { id: "team-001", displayName: "Equipo de Desarrollo", description: "Equipo principal de desarrollo de software" },
  { id: "team-002", displayName: "Equipo de Diseño", description: "UX, UI y recursos gráficos" },
];

const MOCK_CHANNELS: Record<string, Channel[]> = {
  "team-001": [
    { id: "channel-001", displayName: "General", membershipType: "standard" },
    { id: "channel-002", displayName: "Documentación", membershipType: "standard", description: "Docs técnicos y guías" },
    { id: "channel-003", displayName: "Releases", membershipType: "standard" },
  ],
  "team-002": [
    { id: "channel-004", displayName: "General", membershipType: "standard" },
    { id: "channel-005", displayName: "Assets", membershipType: "standard", description: "Recursos gráficos compartidos" },
  ],
};

const now = new Date().toISOString();

const MOCK_FILES: Record<string, DriveItem[]> = {
  "channel-001": [
    {
      id: "item-001",
      name: "README.md",
      size: 2048,
      file: { mimeType: "text/markdown" },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: "https://mock.sharepoint.com/teams/dev/README.md",
    },
    {
      id: "item-002",
      name: "Arquitectura",
      folder: { childCount: 3 },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: "https://mock.sharepoint.com/teams/dev/Arquitectura",
    },
  ],
  "channel-002": [
    {
      id: "item-003",
      name: "guia-onboarding.md",
      size: 5120,
      file: { mimeType: "text/markdown" },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: "https://mock.sharepoint.com/teams/dev/docs/guia-onboarding.md",
    },
    {
      id: "item-004",
      name: "api-reference.md",
      size: 12288,
      file: { mimeType: "text/markdown" },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: "https://mock.sharepoint.com/teams/dev/docs/api-reference.md",
    },
  ],
};

const MOCK_FILE_CONTENTS: Record<string, string> = {
  "item-001": `# README\n\nBienvenido al equipo de desarrollo.\n\n## Estructura del proyecto\n\n- /src — código fuente\n- /docs — documentación\n- /tests — pruebas unitarias\n`,
  "item-003": `# Guía de Onboarding\n\n## Primeros pasos\n\n1. Configura tu entorno local\n2. Clona el repositorio principal\n3. Instala las dependencias con \`npm install\`\n`,
  "item-004": `# API Reference\n\n## Endpoints\n\n### GET /api/users\nDevuelve la lista de usuarios.\n\n### POST /api/users\nCrea un nuevo usuario.\n`,
};

/**
 * Mock implementation of GraphClient that returns static data.
 * Used when TEAMS_MCP_MOCK=true to test the MCP without Azure credentials.
 */
export class MockGraphClient implements IGraphClient {
  // ─── Teams ─────────────────────────────────────────────────────────────────

  listJoinedTeams(): Promise<GraphListResponse<Team>> {
    return Promise.resolve({ value: MOCK_TEAMS });
  }

  listChannels(teamId: string): Promise<GraphListResponse<Channel>> {
    return Promise.resolve({ value: MOCK_CHANNELS[teamId] ?? [] });
  }

  // ─── Files ─────────────────────────────────────────────────────────────────

  getChannelFilesFolder(teamId: string, channelId: string): Promise<DriveItem> {
    void teamId;
    return Promise.resolve({
      id: `root-${channelId}`,
      name: "Documents",
      folder: { childCount: 2 },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: "https://mock.sharepoint.com",
    });
  }

  listFolderChildren(teamId: string, folderId: string): Promise<GraphListResponse<DriveItem>> {
    void teamId;
    // If folderId is a root-<channelId>, extract channelId
    const channelId = folderId.startsWith("root-") ? folderId.slice(5) : folderId;
    return Promise.resolve({ value: MOCK_FILES[channelId] ?? [] });
  }

  getItem(teamId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    void teamId;
    for (const items of Object.values(MOCK_FILES)) {
      const found = items.find((i) => i.id === itemId);
      if (found) {
        return Promise.resolve({
          ...found,
          "@microsoft.graph.downloadUrl": `https://mock.download/${itemId}`,
        });
      }
    }
    return Promise.reject(new Error(`[Mock] Item not found: ${itemId}`));
  }

  downloadFileContent(_downloadUrl: string): Promise<string> {
    // Extract item ID from mock URL
    const itemId = _downloadUrl.split("/").pop() ?? "";
    const content = MOCK_FILE_CONTENTS[itemId];
    if (content === undefined) {
      return Promise.reject(new Error(`[Mock] No mock content for item: ${itemId}`));
    }
    return Promise.resolve(content);
  }

  uploadFile(_teamId: string, parentId: string, fileName: string, content: string): Promise<DriveItem> {
    console.error(`[Mock] Simulated upload: ${fileName} (${content.length} chars) → folder ${parentId}`);
    return Promise.resolve({
      id: `mock-upload-${Date.now()}`,
      name: fileName,
      size: content.length,
      file: { mimeType: "text/plain" },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/${fileName}`,
    });
  }

  createFolder(_teamId: string, parentId: string, folderName: string): Promise<DriveItem> {
    console.error(`[Mock] Simulated folder creation: ${folderName} inside ${parentId}`);
    return Promise.resolve({
      id: `mock-folder-${Date.now()}`,
      name: folderName,
      folder: { childCount: 0 },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/${folderName}`,
    });
  }

  deleteItem(_teamId: string, itemId: string): Promise<void> {
    console.error(`[Mock] Simulated delete: ${itemId}`);
    return Promise.resolve();
  }

  patchItem(_teamId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem> {
    console.error(`[Mock] Simulated patch on ${itemId}:`, patch);
    return Promise.resolve({
      id: itemId,
      name: (patch.name as string | undefined) ?? "renamed-item",
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/${itemId}`,
    });
  }

  // ─── SharePoint Sites (mock) ───────────────────────────────────────────────

  getSite(_hostname: string, sitePath: string): Promise<Site> {
    return Promise.resolve({
      id: "mock-site-001",
      displayName: "SEAT-SquadBTPS124",
      name: sitePath.split("/").pop() ?? sitePath,
      webUrl: `https://mock.sharepoint.com/sites/${sitePath}`,
    });
  }

  listSiteDrives(_siteId: string): Promise<GraphListResponse<Drive>> {
    return Promise.resolve({
      value: [
        { id: "mock-drive-001", name: "Documents", driveType: "documentLibrary", webUrl: "https://mock.sharepoint.com/sites/mock/Documents" },
        { id: "mock-drive-002", name: "General", driveType: "documentLibrary", webUrl: "https://mock.sharepoint.com/sites/mock/General" },
      ],
    });
  }

  getSiteDriveRoot(_siteId: string): Promise<DriveItem> {
    return Promise.resolve({
      id: "mock-site-root",
      name: "root",
      folder: { childCount: 3 },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: "https://mock.sharepoint.com/sites/mock/Documents",
    });
  }

  listSiteChildren(_siteId: string, _itemId: string): Promise<GraphListResponse<DriveItem>> {
    const now = new Date().toISOString();
    return Promise.resolve({
      value: [
        { id: "mock-site-item-001", name: "README.md", size: 1024, file: { mimeType: "text/markdown" }, lastModifiedDateTime: now, createdDateTime: now, webUrl: "https://mock.sharepoint.com/sites/mock/Documents/README.md" },
        { id: "mock-site-item-002", name: "Docs", folder: { childCount: 2 }, lastModifiedDateTime: now, createdDateTime: now, webUrl: "https://mock.sharepoint.com/sites/mock/Documents/Docs" },
      ],
    });
  }

  getSiteItem(_siteId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    const now = new Date().toISOString();
    return Promise.resolve({
      id: itemId,
      name: "mock-file.md",
      size: 512,
      file: { mimeType: "text/markdown" },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: `https://mock.sharepoint.com/sites/mock/${itemId}`,
      "@microsoft.graph.downloadUrl": `https://mock.download/site/${itemId}`,
    });
  }

  uploadSiteFile(_siteId: string, parentId: string, fileName: string, content: string | Buffer, _contentType?: string, _ifMatch?: string): Promise<DriveItem> {
    const size = typeof content === "string" ? content.length : content.byteLength;
    console.error(`[Mock] Simulated SharePoint upload: ${fileName} (${size} bytes) → folder ${parentId}`);
    return Promise.resolve({
      id: `mock-site-upload-${Date.now()}`,
      name: fileName,
      size,
      file: { mimeType: "application/octet-stream" },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/sites/mock/${fileName}`,
    });
  }

  createSiteFolder(_siteId: string, parentId: string, folderName: string): Promise<DriveItem> {
    console.error(`[Mock] Simulated SharePoint folder creation: ${folderName} inside ${parentId}`);
    return Promise.resolve({
      id: `mock-site-folder-${Date.now()}`,
      name: folderName,
      folder: { childCount: 0 },
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/sites/mock/${folderName}`,
    });
  }

  deleteSiteItem(_siteId: string, itemId: string): Promise<void> {
    console.error(`[Mock] Simulated SharePoint delete: ${itemId}`);
    return Promise.resolve();
  }

  patchSiteItem(_siteId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem> {
    console.error(`[Mock] Simulated SharePoint patch on ${itemId}:`, patch);
    return Promise.resolve({
      id: itemId,
      name: (patch.name as string | undefined) ?? "renamed-item",
      lastModifiedDateTime: new Date().toISOString(),
      createdDateTime: new Date().toISOString(),
      webUrl: `https://mock.sharepoint.com/sites/mock/${itemId}`,
    });
  }

  searchSiteFiles(_siteId: string, query: string): Promise<GraphListResponse<DriveItem>> {
    console.error(`[Mock] Simulated SharePoint search: "${query}"`);
    const now = new Date().toISOString();
    return Promise.resolve({
      value: [
        { id: "mock-search-001", name: `${query}-result.md`, size: 256, file: { mimeType: "text/markdown" }, lastModifiedDateTime: now, createdDateTime: now, webUrl: `https://mock.sharepoint.com/sites/mock/search-result.md` },
      ],
    });
  }

  downloadFileBuffer(_downloadUrl: string): Promise<Buffer> {
    // Devolver un buffer vacío en modo mock / Return empty buffer in mock mode
    console.error(`[Mock] Simulated downloadFileBuffer`);
    return Promise.resolve(Buffer.from(""));
  }

  getSiteItemByPath(_siteId: string, itemPath: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    const now = new Date().toISOString();
    const name = itemPath.split("/").pop() ?? "mock-file.docx";
    return Promise.resolve({
      id: `mock-path-${Date.now()}`,
      name,
      size: 1024,
      file: { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      lastModifiedDateTime: now,
      createdDateTime: now,
      webUrl: `https://mock.sharepoint.com/sites/mock/${name}`,
      "@microsoft.graph.downloadUrl": `https://mock.download/path/${encodeURIComponent(name)}`,
    });
  }

  // Mock: devuelve un usuario de prueba /
  // Mock: returns a test user
  getCurrentUser(): Promise<GraphUser> {
    return Promise.resolve({
      id: "mock-user-001",
      displayName: "Mock User",
      mail: "mockuser@example.com",
      userPrincipalName: "mockuser@example.com",
    });
  }
}


