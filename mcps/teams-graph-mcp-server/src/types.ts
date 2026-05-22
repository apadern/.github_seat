export interface Team {
  id: string;
  displayName: string;
  description?: string;
}

export interface Site {
  id: string;
  displayName: string;
  name: string;
  webUrl: string;
  description?: string;
}

export interface Drive {
  id: string;
  name: string;
  description?: string;
  driveType: string;
  webUrl: string;
}

export interface Channel {
  id: string;
  displayName: string;
  description?: string;
  membershipType?: string;
}

export interface DriveItem {
  id: string;
  name: string;
  size?: number;
  file?: { mimeType: string };
  folder?: { childCount: number };
  lastModifiedDateTime: string;
  createdDateTime: string;
  webUrl: string;
  parentReference?: {
    driveId: string;
    id: string;
    path: string;
  };
  "@microsoft.graph.downloadUrl"?: string;
}

export interface GraphListResponse<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

export interface GraphErrorResponse {
  error?: {
    code: string;
    message: string;
    innerError?: unknown;
  };
}

/** Interface implemented by both GraphClient and MockGraphClient */
export interface IGraphClient {
  // ─── Teams ────────────────────────────────────────────────────────────────
  listJoinedTeams(): Promise<GraphListResponse<Team>>;
  listChannels(teamId: string): Promise<GraphListResponse<Channel>>;
  getChannelFilesFolder(teamId: string, channelId: string): Promise<DriveItem>;
  listFolderChildren(teamId: string, folderId: string): Promise<GraphListResponse<DriveItem>>;
  getItem(teamId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }>;
  downloadFileContent(downloadUrl: string): Promise<string>;
  uploadFile(teamId: string, parentId: string, fileName: string, content: string): Promise<DriveItem>;
  createFolder(teamId: string, parentId: string, folderName: string): Promise<DriveItem>;
  deleteItem(teamId: string, itemId: string): Promise<void>;
  patchItem(teamId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem>;

  // ─── SharePoint Sites ─────────────────────────────────────────────────────
  getSite(hostname: string, sitePath: string): Promise<Site>;
  listSiteDrives(siteId: string): Promise<GraphListResponse<Drive>>;
  getSiteDriveRoot(siteId: string): Promise<DriveItem>;
  listSiteChildren(siteId: string, itemId: string): Promise<GraphListResponse<DriveItem>>;
  getSiteItem(siteId: string, itemId: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }>;
  uploadSiteFile(siteId: string, parentId: string, fileName: string, content: string | Buffer, contentType?: string): Promise<DriveItem>;
  createSiteFolder(siteId: string, parentId: string, folderName: string): Promise<DriveItem>;
  deleteSiteItem(siteId: string, itemId: string): Promise<void>;
  patchSiteItem(siteId: string, itemId: string, patch: Record<string, unknown>): Promise<DriveItem>;
  searchSiteFiles(siteId: string, query: string): Promise<GraphListResponse<DriveItem>>;

  // Descarga binaria y acceso por ruta / Binary download and path-based access
  downloadFileBuffer(downloadUrl: string): Promise<Buffer>;
  getSiteItemByPath(siteId: string, itemPath: string): Promise<DriveItem & { "@microsoft.graph.downloadUrl"?: string }>;
}
