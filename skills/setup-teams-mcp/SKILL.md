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

Leer el output e identificar qué acciones son necesarias. Si todo es `✅`, saltarse los pasos 2 y 3 directamente al Paso 4 (verificación de autenticación del agente llamante).

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

### Paso 4 — Informar al usuario si se realizaron cambios

Si se ejecutaron acciones en los pasos 2 o 3, **detener el flujo y mostrar este mensaje al usuario**:

> ⚙️ **Setup del MCP de Teams completado**
>
> Se han realizado los siguientes cambios para que el servidor MCP funcione correctamente:
>
> - _(listar las acciones realizadas: npm install / npm run build / registro en mcp.json)_
>
> **Pasos necesarios antes de continuar:**
>
> 1. Ejecuta el comando **Developer: Reload Window** en VS Code
>    (`Ctrl+Shift+P` → escribe `Reload Window` → Enter)
> 2. Una vez recargada la ventana, abre el panel de Chat, localiza el servidor **teams-graph** en la sección MCP y pulsa **Start Server**.
> 3. Cuando el servidor esté en estado **Running**, vuelve a ejecutar este prompt o agente.

No continuar el flujo principal hasta que el usuario confirme que el servidor está en marcha.

---

### Notas sobre falsos positivos

- `node_modules/` puede existir pero estar incompleto si `npm install` fue interrumpido. Si las herramientas MCP fallan incluso con `dist/` presente, sugerir al usuario limpiar con `rm -rf node_modules && npm install`.
- El registro en `mcp.json` puede estar correcto pero el servidor puede estar parado. En ese caso el agente llamante recibirá un error de herramienta; el usuario debe arrancar el servidor manualmente desde el panel MCP de VS Code.
