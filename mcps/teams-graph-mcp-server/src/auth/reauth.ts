/**
 * Script de reautenticación standalone para el servidor MCP de Teams/SharePoint.
 * Ejecuta el device code flow y guarda el token en caché para uso posterior.
 * 
 * Standalone re-authentication script for the Teams/SharePoint MCP server.
 * Runs the device code flow and saves the token to cache for later use.
 * 
 * Uso / Usage:
 *   npm run auth
 *   node --import tsx/esm src/auth/reauth.ts
 */

import { AuthProvider } from "./authProvider.js";

const CLIENT_ID = process.env.TEAMS_MCP_CLIENT_ID;
const TENANT_ID = process.env.TEAMS_MCP_TENANT_ID ?? "common";

if (!CLIENT_ID) {
    console.error("ERROR: La variable de entorno TEAMS_MCP_CLIENT_ID es obligatoria.");
    process.exit(1);
}

console.error("[Auth] Iniciando flujo de reautenticación con Microsoft...");
console.error(`[Auth] Client ID: ${CLIENT_ID}`);
console.error(`[Auth] Tenant:    ${TENANT_ID}`);
console.error("");

try {
    const auth = new AuthProvider(CLIENT_ID, TENANT_ID);
    const token = await auth.getAccessToken();
    if (token) {
        console.error("[Auth] ✓ Autenticación completada. Token guardado en caché.");
        process.exit(0);
    }
} catch (err) {
    console.error("[Auth] ✗ Error durante la autenticación:", err);
    process.exit(1);
}
