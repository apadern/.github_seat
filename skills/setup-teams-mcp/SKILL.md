# Setup inicial del MCP de Teams-Graph

## Propósito

Verificar que el servidor MCP `teams-graph` está correctamente compilado y registrado antes de ejecutar cualquier flujo que use herramientas de SharePoint/Teams. Si se detectan carpetas faltantes (`dist/` o `node_modules/`) o ausencia del registro en `.vscode/mcp.json`, este skill corrige el estado y guía al usuario para completar la puesta en marcha.

---

## Triggers y cuándo usar la skill

Invocar este skill **siempre como primer paso** en agentes que usen herramientas `mcp_teams-graph_*`. También se activa ante frases como:

- "el MCP de Teams no funciona"
- "no encuentro las herramientas de SharePoint"
- "error al conectar con Teams"
- "configura el MCP de Teams"
- "setup teams mcp"
- "cómo instalo el MCP de Teams"
- "el servidor MCP no arranca"
- "dist no existe" / "node_modules no existe"

---

## Procedimiento

### Paso 1 — Detectar el estado actual del MCP

Ejecutar el siguiente script de detección:

```bash
MCP_DIR="/home/user/projects/.github/mcps/teams-graph-mcp-server"
MCP_JSON="/home/user/projects/.vscode/mcp.json"

echo "=== Estado del MCP teams-graph ==="
echo ""

# Comprobar node_modules
if [ -d "$MCP_DIR/node_modules" ]; then
  echo "✅ node_modules  → existe"
  NODE_OK=true
else
  echo "❌ node_modules  → FALTA (hay que ejecutar npm install)"
  NODE_OK=false
fi

# Comprobar dist
if [ -d "$MCP_DIR/dist" ]; then
  echo "✅ dist/          → existe"
  DIST_OK=true
else
  echo "❌ dist/          → FALTA (hay que ejecutar npm run build)"
  DIST_OK=false
fi

# Comprobar index.js compilado
if [ -f "$MCP_DIR/dist/index.js" ]; then
  echo "✅ dist/index.js  → existe"
else
  echo "❌ dist/index.js  → FALTA"
fi

echo ""
# Comprobar registro en mcp.json
if [ -f "$MCP_JSON" ] && grep -q '"teams-graph"' "$MCP_JSON"; then
  echo "✅ mcp.json       → teams-graph registrado"
  MCP_JSON_OK=true
else
  echo "❌ mcp.json       → teams-graph NO registrado"
  MCP_JSON_OK=false
fi

echo ""
echo "NODE_OK=$NODE_OK  DIST_OK=$DIST_OK  MCP_JSON_OK=$MCP_JSON_OK"
```

Leer el output e identificar qué acciones son necesarias. Si todo es `✅`, saltarse los pasos 2 y 3 directamente al Paso 4 (arranque y verificación del servidor) y Paso 5 (autenticación de Teams).

---

### Paso 2 — Instalar dependencias y compilar (si falta node_modules o dist)

Si `NODE_OK=false` o `DIST_OK=false`, ejecutar en orden:

```bash
cd /home/user/projects/.github/mcps/teams-graph-mcp-server

# Instalar dependencias (solo si no existen)
[ -d node_modules ] || npm install

# Compilar el servidor TypeScript
npm run build
```

Verificar que `dist/index.js` existe tras el build. Si falla el build, mostrar el error completo al usuario y detener el flujo.

---

### Paso 3 — Registrar el MCP en .vscode/mcp.json (si no está registrado)

Si `MCP_JSON_OK=false`:

**3a.** Comprobar si el fichero `.vscode/mcp.json` existe:

```bash
ls -la /home/user/projects/.vscode/mcp.json 2>/dev/null || echo "FICHERO_NO_EXISTE"
```

**3b.** Si el fichero **existe** pero no contiene `teams-graph`, leerlo con `read_file` y añadir la entrada dentro de `"servers"` usando `replace_string_in_file`.

**3c.** Si el fichero **no existe**, crearlo con `create_file`:

```json
{
    "servers": {
        "teams-graph": {
            "type": "stdio",
            "command": "node",
            "args": ["/home/user/projects/.github/mcps/teams-graph-mcp-server/dist/index.js"],
            "cwd": "/home/user/projects/.github/mcps/teams-graph-mcp-server",
            "env": {
                "TEAMS_MCP_CLIENT_ID": "c9512ef5-2f33-4f63-bda1-848f9121444d",
                "TEAMS_MCP_TENANT_ID": "3048dc87-43f0-4100-9acb-ae1971c79395",
                "SHAREPOINT_HOSTNAME": "everisgroup.sharepoint.com",
                "SHAREPOINT_SITE_PATH": "sites/SEAT-SquadBTPS124"
            }
        }
    }
}
```

---

### Paso 4 — Arrancar el servidor MCP tras recargar la ventana

Si se ejecutaron acciones en los pasos 2 o 3, **detener el flujo y mostrar este mensaje al usuario**:

> ⚙️ **Setup del MCP de Teams completado**
>
> Se han realizado los siguientes cambios:
>
> - _(listar las acciones realizadas: npm install / npm run build / registro en mcp.json)_
>
> **Sigue estos pasos exactamente para poner en marcha el servidor:**
>
> **1. Recarga la ventana de VS Code**
> - Pulsa `Ctrl+Shift+P`, escribe **`Reload Window`** y pulsa Enter.
> - Espera a que VS Code termine de cargar completamente.
>
> **2. Arranca el servidor MCP desde la paleta de comandos**
> - Pulsa `Ctrl+Shift+P`, escribe **`MCP: List Servers`** y pulsa Enter.
> - En la lista que aparece, selecciona **`teams-graph`**.
> - Pulsa **`Start Server`**.
> - El estado debe cambiar a verde 🟢 o mostrar **Running**.
>
> **3. Confirma que el servidor está en marcha**
> - Vuelve a este chat y responde **"servidor listo"** para continuar con la autenticación.

No continuar al Paso 5 hasta que el usuario confirme que el servidor está en estado **Running**.

---

### Paso 5 — Verificar y realizar la autenticación de Teams

Con el servidor `teams-graph` en estado Running, verificar si la sesión de Microsoft/Teams está activa intentando llamar a una herramienta de comprobación.

**5a. Comprobar el estado de autenticación**

Comprobar si existe el fichero de caché de token (instantáneo, sin llamada a SharePoint):

```bash
ls ~/.teams-graph-mcp-msal-cache.json 2>/dev/null && echo "TOKEN_EXISTE" || echo "NO_TOKEN"
```

- Si el output es `NO_TOKEN` → autenticación necesaria ❌. **Pasar inmediatamente al paso 5b en el mismo turno, sin esperar confirmación del usuario.**
- Si el output es `TOKEN_EXISTE` → el token está cacheado ✅. Continuar al flujo principal. Si más adelante una llamada a SharePoint devuelve `401` o `token expired`, volver al paso 5b.

**5b. Si la autenticación NO está activa — el agente ejecuta el login directamente**

No pedir al usuario que ejecute nada y no esperar confirmación — ejecutar en el mismo turno. El agente debe lanzar el comando de autenticación desde el terminal:

```bash
cd /home/user/projects/.github/mcps/teams-graph-mcp-server
npm run auth
```

El comando mostrará una URL de Microsoft login en el output del terminal. Mostrar esa URL al usuario con el siguiente mensaje:

> 🔐 **Autenticación de Teams requerida**
>
> Abre esta URL en el navegador e inicia sesión con tu cuenta corporativa SEAT / NTT Data:
>
> `[URL que aparece en el terminal]`
>
> Cuando hayas completado el login, responde **"autenticado"** aquí.

**5c. Verificación post-autenticación**

Tras la confirmación del usuario, volver a invocar la herramienta de comprobación del paso 5a:
- Si responde con datos válidos → flujo completado ✅. Continuar con el agente llamante.
- Si sigue fallando → mostrar el error exacto al usuario y sugerir:
  1. Reiniciar el servidor MCP (Stop + Start en el panel MCP de VS Code).
  2. Volver a ejecutar el login del paso 5b.
  3. Si persiste, revisar que `TEAMS_MCP_CLIENT_ID` y `TEAMS_MCP_TENANT_ID` en `mcp.json` son correctos.

---

### Notas sobre falsos positivos

- `node_modules/` puede existir pero estar incompleto si `npm install` fue interrumpido. Si las herramientas MCP fallan incluso con `dist/` presente, sugerir al usuario limpiar con `rm -rf node_modules && npm install`.
- El registro en `mcp.json` puede estar correcto pero el servidor puede estar parado. En ese caso el agente llamante recibirá un error de herramienta; el usuario debe arrancar el servidor manualmente desde el panel MCP de VS Code.
- Un token de autenticación puede estar expirado aunque la sesión previa fuera correcta. En ese caso el error será `401` o `token expired`; repetir el paso 5b.
