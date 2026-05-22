import { GRAPH_BASE_URL } from "../constants.js";
import type { AuthProvider } from "../auth/authProvider.js";
import type {
  IGraphClient,
  Team,
  Channel,
  Site,
  Drive,
  DriveItem,
  GraphListResponse,
  GraphErrorResponse,
} from "../types.js";

export class GraphClient implements IGraphClient {
  private auth: AuthProvider;

  constructor(auth: AuthProvider) {
    this.auth = auth;
  }

  private async call<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return {} as T;

    if (!response.ok) {
      let message = `Graph API error ${response.status} on ${method} ${path}`;
      try {
        const err = (await response.json()) as GraphErrorResponse;
        if (err.error) message = `Graph API [${err.error.code}]: ${err.error.message}`;
      } catch {
        message += ` — ${await response.text()}`;
      }
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  listJoinedTeams(): Promise<GraphListResponse<Team>> {
    return this.call("GET", "/me/joinedTeams");
  }

  listChannels(teamId: string): Promise<GraphListResponse<Channel>> {
    return this.call("GET", `/teams/${enc(teamId)}/channels`);
  }

  getChannelFilesFolder(teamId: string, channelId: string): Promise<DriveItem> {
    return this.call("GET", `/teams/${enc(teamId)}/channels/${enc(channelId)}/filesFolder`);
  }

  listFolderChildren(teamId: string, folderId: string): Promise<GraphListResponse<DriveItem>> {
    return this.call("GET", `/groups/${enc(teamId)}/drive/items/${enc(folderId)}/children`);
  }

  getItem(teamId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    return this.call("GET", `/groups/${enc(teamId)}/drive/items/${enc(itemId)}`);
  }

  async downloadFileContent(downloadUrl: string): Promise<string> {
    const token = await this.auth.getAccessToken();
    const response = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Download failed ${response.status}: ${await response.text()}`);
    return response.text();
  }

  async uploadFile(teamId: string, parentId: string, fileName: string, content: string): Promise<DriveItem> {
    const token = await this.auth.getAccessToken();
    const path = `/groups/${enc(teamId)}/drive/items/${enc(parentId)}:/${encodeURIComponent(fileName)}:/content`;
    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
      body: content,
    });
    if (!response.ok) throw new Error(`Upload failed ${response.status}: ${await response.text()}`);
    return response.json() as Promise<DriveItem>;
  }

  createFolder(teamId: string, parentId: string, folderName: string): Promise<DriveItem> {
    return this.call("POST", `/groups/${enc(teamId)}/drive/items/${enc(parentId)}/children`, {
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    });
  }

  deleteItem(teamId: string, itemId: string): Promise<void> {
    return this.call("DELETE", `/groups/${enc(teamId)}/drive/items/${enc(itemId)}`);
  }

  patchItem(teamId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem> {
    return this.call("PATCH", `/groups/${enc(teamId)}/drive/items/${enc(itemId)}`, patch);
  }

  // ─── SharePoint Sites ─────────────────────────────────────────────────────

  getSite(hostname: string, sitePath: string): Promise<Site> {
    // Resolve site by hostname and server-relative path /
    // Resuelve el sitio por hostname y ruta relativa al servidor
    return this.call("GET", `/sites/${enc(hostname)}:/${sitePath}`);
  }

  listSiteDrives(siteId: string): Promise<GraphListResponse<Drive>> {
    return this.call("GET", `/sites/${enc(siteId)}/drives`);
  }

  getSiteDriveRoot(siteId: string): Promise<DriveItem> {
    return this.call("GET", `/sites/${enc(siteId)}/drive/root`);
  }

  listSiteChildren(siteId: string, itemId: string): Promise<GraphListResponse<DriveItem>> {
    return this.call("GET", `/sites/${enc(siteId)}/drive/items/${enc(itemId)}/children`);
  }

  getSiteItem(siteId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    // Sin $select para que @microsoft.graph.downloadUrl se incluya como anotación transitoria /
    // No $select so @microsoft.graph.downloadUrl is included as a transient annotation
    return this.call("GET", `/sites/${enc(siteId)}/drive/items/${enc(itemId)}`);
  }

  async uploadSiteFile(
    siteId: string,
    parentId: string,
    fileName: string,
    content: string | Buffer,
    contentType = "application/octet-stream"
  ): Promise<DriveItem> {
    const token = await this.auth.getAccessToken();
    const path = `/sites/${enc(siteId)}/drive/items/${enc(parentId)}:/${encodeURIComponent(fileName)}:/content`;
    // Convertir Buffer a Uint8Array para compatibilidad con fetch / Convert Buffer to Uint8Array for fetch compatibility
    const body: BodyInit = typeof content === "string" ? content : new Uint8Array(content);
    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body,
    });
    if (!response.ok) throw new Error(`Upload failed ${response.status}: ${await response.text()}`);
    return response.json() as Promise<DriveItem>;
  }

  createSiteFolder(siteId: string, parentId: string, folderName: string): Promise<DriveItem> {
    return this.call("POST", `/sites/${enc(siteId)}/drive/items/${enc(parentId)}/children`, {
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail",
    });
  }

  deleteSiteItem(siteId: string, itemId: string): Promise<void> {
    return this.call("DELETE", `/sites/${enc(siteId)}/drive/items/${enc(itemId)}`);
  }

  patchSiteItem(siteId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem> {
    return this.call("PATCH", `/sites/${enc(siteId)}/drive/items/${enc(itemId)}`, patch);
  }

  searchSiteFiles(siteId: string, query: string): Promise<GraphListResponse<DriveItem>> {
    return this.call("GET", `/sites/${enc(siteId)}/drive/search(q='${encodeURIComponent(query)}')`);
  }

  async downloadFileBuffer(downloadUrl: string): Promise<Buffer> {
    const token = await this.auth.getAccessToken();
    const response = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Download failed ${response.status}: ${await response.text()}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  getSiteItemByPath(siteId: string, itemPath: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }> {
    // Codificar cada segmento del path por separado para preservar las barras /
    // Encode each path segment separately to preserve slashes
    // Sin $select para que @microsoft.graph.downloadUrl se incluya como anotación transitoria /
    // No $select so @microsoft.graph.downloadUrl is included as a transient annotation
    const encodedPath = itemPath.split("/").map(encodeURIComponent).join("/");
    return this.call(
      "GET",
      `/sites/${enc(siteId)}/drive/root:/${encodedPath}`
    );
  }
}

const enc = encodeURIComponent;
