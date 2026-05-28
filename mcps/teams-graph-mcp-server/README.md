# teams-graph-mcp-server

Servidor MCP (_Model Context Protocol_) que permite a GitHub Copilot acceder a **Microsoft Teams** y **SharePoint** a través de Microsoft Graph API.

Toda la configuración es por variables de entorno — sin valores hardcodeados — por lo que cualquier equipo puede usarlo apuntando a su propio sitio SharePoint y tenant de Azure.

---

## Herramientas disponibles

### Teams (`teams_*`)

| Herramienta | Descripción |
|---|---|
| `teams_list_teams` | Lista los equipos de Teams del usuario autenticado |
| `teams_list_channels` | Lista los canales de un equipo |
| `teams_list_files` | Lista archivos y carpetas en un canal |
| `teams_read_file` | Lee el contenido de un archivo de Teams |
| `teams_upload_file` | Sube o sobreescribe un archivo en Teams |
| `teams_get_file_info` | Obtiene metadatos de un archivo |
| `teams_create_folder` | Crea una carpeta en Teams |
| `teams_delete_file` | Elimina un archivo o carpeta |
| `teams_move_file` | Mueve un archivo a otra ubicación |

### SharePoint (`sharepoint_*`)

| Herramienta | Descripción |
|---|---|
| `sharepoint_get_site` | Obtiene información del sitio SharePoint configurado |
| `sharepoint_list_drives` | Lista las bibliotecas de documentos del sitio |
| `sharepoint_list_items` | Lista archivos y carpetas en una biblioteca |
| `sharepoint_read_file` | Lee el contenido de un archivo de SharePoint |
| `sharepoint_upload_file` | Sube contenido textual a SharePoint |
| `sharepoint_upload_local_file` | Sube un archivo local del disco a SharePoint |
| `sharepoint_create_folder` | Crea una carpeta en SharePoint |
| `sharepoint_delete_item` | Elimina un archivo o carpeta |
| `sharepoint_move_item` | Mueve un elemento a otra ubicación |
| `sharepoint_search_files` | Busca archivos por nombre |
| `sharepoint_read_docx` | Extrae el texto de un `.docx` de SharePoint |

### Usuario (`graph_*`)

| Herramienta | Descripción |
|---|---|
| `graph_get_current_user` | Devuelve el perfil del usuario autenticado (nombre, email, id) |

---

## Requisitos previos

- **Node.js** ≥ 18
- **Cuenta Microsoft** con acceso al tenant de tu organización
- **App registrada en Azure AD** con los permisos delegados indicados abajo

---

## 1. Registrar la app en Azure AD (una vez por equipo)

1. Ir a [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **Registros de aplicaciones** → **Nueva registro**.
2. Nombre: cualquiera (p. ej. `Copilot MCP Teams`).
3. Tipo de cuenta: *Cuentas de esta organización*.
4. URI de redirección: plataforma **"Mobile and desktop"**, URI:
   ```
   https://login.microsoftonline.com/common/oauth2/nativeclient
   ```
5. En **Permisos de API** → Agregar permiso → Microsoft Graph → Permisos delegados:
   - `Files.ReadWrite.All`
   - `Sites.ReadWrite.All`
   - `User.Read`
   - `offline_access`
6. Conceder consentimiento de administrador (si tu organización lo requiere).
7. Anotar el **Application (client) ID** y el **Directory (tenant) ID**.

---

## 2. Instalar y compilar (una vez)

```bash
cd .github/mcps/teams-graph-mcp-server
npm install
npm run build
```

---

## 3. Configurar `.vscode/mcp.json`

Añade (o crea) el fichero `.vscode/mcp.json` en la raíz de tu workspace:

```json
{
  "servers": {
    "teams-graph": {
      "type": "stdio",
      "command": "node",
      "args": ["<ruta-absoluta>/.github/mcps/teams-graph-mcp-server/dist/index.js"],
      "cwd": "<ruta-absoluta>/.github/mcps/teams-graph-mcp-server",
      "env": {
        "TEAMS_MCP_CLIENT_ID": "<tu-client-id>",
        "TEAMS_MCP_TENANT_ID": "<tu-tenant-id>",
        "SHAREPOINT_HOSTNAME": "<tu-dominio>.sharepoint.com",
        "SHAREPOINT_SITE_PATH": "sites/<nombre-del-sitio>"
      }
    }
  }
}
```

> **Truco**: puedes encontrar `SHAREPOINT_SITE_PATH` en la URL del sitio SharePoint.  
> Ejemplo: `https://miempresa.sharepoint.com/sites/MiEquipo-Proyecto` → `sites/MiEquipo-Proyecto`

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `TEAMS_MCP_CLIENT_ID` | ✅ | Client ID de la app Azure AD |
| `TEAMS_MCP_TENANT_ID` | ❌ | Tenant ID (por defecto: `common`) |
| `SHAREPOINT_HOSTNAME` | ❌ | Dominio SharePoint (por defecto: `everisgroup.sharepoint.com`) |
| `SHAREPOINT_SITE_PATH` | ❌ | Ruta del sitio (por defecto: `sites/SEAT-SquadBTPS124`) |
| `TEAMS_MCP_MOCK` | ❌ | Poner `true` para modo sin conexión (datos ficticios) |

---

## 4. Primera autenticación

El servidor usa **Device Code Flow**: la primera vez (o cuando el token expire) muestra un código en el terminal que debes introducir en [microsoft.com/devicelogin](https://microsoft.com/devicelogin).

Para autenticarte antes de arrancar VS Code:

```bash
npm run auth
```

El token queda cacheado en `~/.teams-graph-mcp-msal-cache.json` (permisos 600). Las sesiones siguientes se autentican de forma silenciosa usando el refresh token.

---

## 5. Modo desarrollo / mock

Para probar sin conexión a Azure:

```json
"env": {
  "TEAMS_MCP_MOCK": "true"
}
```

---

## Estructura del proyecto

```
src/
  auth/
    authProvider.ts     ← Autenticación MSAL (device code + caché)
    reauth.ts           ← Script `npm run auth`
  services/
    graphClient.ts      ← Cliente real Microsoft Graph
  tools/
    teamTools.ts        ← Herramientas teams_* y graph_*
    fileTools.ts        ← Herramientas teams_* de ficheros
    sharepointTools.ts  ← Herramientas sharepoint_*
  constants.ts          ← URLs base y valores por defecto
  types.ts              ← Interfaces TypeScript
  index.ts              ← Punto de entrada del servidor MCP
```

---

## Cómo copiar el MCP a otro proyecto

1. Copiar la carpeta completa `.github/mcps/teams-graph-mcp-server/` al nuevo proyecto.
2. Copiar la skill `.github/skills/setup-teams-mcp/` al nuevo proyecto para que Copilot pueda automatizar el setup (detección de estado, instalación, registro en `mcp.json` y autenticación).
3. Seguir los pasos 1–4 de esta guía con los datos del nuevo equipo.
4. No es necesario modificar ningún fichero de código fuente — solo las variables del `mcp.json`.
