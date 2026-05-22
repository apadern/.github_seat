import * as msal from "@azure/msal-node";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { GRAPH_SCOPES, TOKEN_CACHE_FILE } from "../constants.js";

const CACHE_PATH = join(homedir(), TOKEN_CACHE_FILE);

/**
 * Provee tokens de acceso delegados usando MSAL Node con caché persistente en disco.
 * Requiere una app registrada en Azure AD (client ID).
 * Estrategias en orden:
 * 1. Adquisición silenciosa desde la caché MSAL en disco
 * 2. Device code flow — el usuario visita microsoft.com/devicelogin con el código mostrado
 *
 * Provides delegated access tokens using MSAL Node with persistent disk cache.
 * Requires an app registered in Azure AD (client ID).
 * Strategies in order:
 * 1. Silent acquisition from MSAL disk cache
 * 2. Device code flow — user visits microsoft.com/devicelogin with the displayed code
 */
export class AuthProvider {
  private pca: msal.PublicClientApplication;

  constructor(clientId: string, tenantId: string) {
    // Plugin de caché persistente en disco (permisos 0600 para proteger tokens) /
    // Persistent disk cache plugin (0600 permissions to protect tokens)
    const cachePlugin: msal.ICachePlugin = {
      beforeCacheAccess: async (cacheContext) => {
        if (existsSync(CACHE_PATH)) {
          cacheContext.tokenCache.deserialize(readFileSync(CACHE_PATH, "utf-8"));
        }
      },
      afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
          writeFileSync(CACHE_PATH, cacheContext.tokenCache.serialize(), { mode: 0o600 });
        }
      },
    };

    this.pca = new msal.PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
      cache: { cachePlugin },
    });
  }

  async getAccessToken(): Promise<string> {
    // 1. Intentar adquisición silenciosa desde la caché MSAL /
    //    Try silent acquisition from MSAL cache (uses refresh token if access token expired)
    const accounts = await this.pca.getTokenCache().getAllAccounts();
    if (accounts.length > 0) {
      try {
        const result = await this.pca.acquireTokenSilent({
          account: accounts[0],
          scopes: GRAPH_SCOPES,
        });
        if (result?.accessToken) return result.accessToken;
      } catch {
        // Caché expirada o inválida — continuar con flujo interactivo /
        // Expired or invalid cache — proceed with interactive flow
      }
    }

    // 2. Device code flow: muestra código al usuario para autenticarse /
    //    Device code flow: shows code for user to authenticate at microsoft.com/devicelogin
    console.error("[Auth] Iniciando autenticación. Sigue las instrucciones a continuación...");
    const result = await this.pca.acquireTokenByDeviceCode({
      scopes: GRAPH_SCOPES,
      deviceCodeCallback: (response) => {
        console.error(`\n${"─".repeat(60)}`);
        console.error(response.message);
        console.error(`${"─".repeat(60)}\n`);
      },
    });

    if (!result?.accessToken) {
      throw new Error("[Auth] No se pudo obtener un token de acceso.");
    }
    return result.accessToken;
  }
}
