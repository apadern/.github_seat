# Leer y modificar ficheros en SharePoint (SEAT-SquadBTPS124)

## Propósito

Proporciona un flujo guiado para leer, crear, modificar y eliminar ficheros de cualquier tipo en el sitio SharePoint de SEAT (`everisgroup.sharepoint.com/sites/SEAT-SquadBTPS124`) usando el MCP `teams-graph`. Cubre desde la navegación inicial hasta la subida de ficheros binarios (docx, xlsx, imágenes, PDF) y de texto (md, json, csv, js…).

---

## Triggers y cuándo usar la skill

Usa esta skill cuando el usuario diga o implique alguna de las siguientes frases:

- "lee / abre / muestra el contenido de un fichero en SharePoint"
- "sube / crea / modifica un fichero en el SharePoint de SEAT"
- "elimina / borra un fichero de SharePoint"
- "lista los archivos / carpetas del SharePoint"
- "busca un fichero en el SharePoint"
- "mueve / renombra un fichero en SharePoint"
- "crea una carpeta en SharePoint"
- "sube el fichero local … a SharePoint"
- "accede al SharePoint de SEAT-SquadBTPS124"

---

## Procedimiento

### Paso 0 — Verificar que el MCP está disponible

Antes de empezar, confirmar que el servidor MCP `teams-graph` está activo. Si no lo está, indicar al usuario que lo arranque con:

```
Recargar VS Code (Ctrl+Shift+P → "Developer: Reload Window") o reiniciar el servidor MCP en la configuración.
```

---

### Paso 1 — Obtener el ID del sitio SharePoint

Siempre que se necesite el `site_id`, llamar primero a `sharepoint_get_site` sin parámetros (usa el sitio por defecto `SEAT-SquadBTPS124`):

```
sharepoint_get_site()
→ Devuelve: { id, displayName, webUrl }
```

Guardar el `id` devuelto; se reutiliza en todas las llamadas siguientes.

---

### Paso 2 — Navegar por la estructura de ficheros

#### 2a. Listar el contenido raíz

```
sharepoint_list_items({ site_id })
→ Lista carpetas y ficheros del drive raíz
```

#### 2b. Entrar en una subcarpeta

```
sharepoint_list_items({ site_id, folder_id: "<ID de la carpeta>" })
→ Lista el contenido de la carpeta indicada
```

#### 2c. Ver las bibliotecas de documentos disponibles

```
sharepoint_list_drives({ site_id })
→ Lista todas las document libraries del sitio
```

#### 2d. Buscar un fichero por nombre o contenido

```
sharepoint_search_files({ site_id, query: "texto a buscar" })
→ Devuelve los items que coinciden
```

---

### Paso 3 — Leer un fichero

#### Ficheros de texto (md, txt, json, csv, xml, js, ts…)

```
sharepoint_read_file({ site_id, item_id: "<ID del fichero>" })
→ Devuelve el contenido del fichero como texto
```

#### Ficheros binarios (docx, xlsx, imágenes, PDF…)

La herramienta detecta automáticamente que es binario y devuelve la URL de descarga/apertura directa. No intentes leer el contenido; ofrece la URL al usuario o úsala para descargar el fichero localmente si necesitas procesarlo.

---

### Paso 4 — Crear o modificar un fichero

#### 4a. Fichero de texto (subir contenido como string)

```
sharepoint_upload_file({
  site_id,
  parent_id: "<ID de la carpeta destino>",
  file_name: "nombre.md",
  content: "Contenido del fichero en texto plano"
})
→ Crea o sobreescribe el fichero; devuelve ID y URL
```

#### 4b. Fichero local (cualquier tipo, incluidos binarios)

Para subir un fichero que ya existe en el disco local (generado por otro agente o herramienta):

```
sharepoint_upload_local_file({
  site_id,
  parent_id: "<ID de la carpeta destino>",
  local_path: "/ruta/absoluta/al/fichero.docx",
  file_name: "nombre-destino.docx"   // opcional; si se omite, usa el nombre del fichero local
})
→ Lee el fichero del disco, infiere su MIME type y lo sube; devuelve ID y URL
```

**Tipos soportados para upload local**: docx, xlsx, pptx, pdf, png, jpg, svg, zip, md, json, csv, xml, js, ts y cualquier otro formato (fallback a `application/octet-stream`).

---

### Paso 5 — Crear una carpeta

```
sharepoint_create_folder({
  site_id,
  parent_id: "<ID de la carpeta padre>",
  folder_name: "NombreCarpeta"
})
→ Crea la carpeta; devuelve ID y URL
```

---

### Paso 6 — Mover o renombrar un elemento

```
sharepoint_move_item({
  site_id,
  item_id: "<ID del elemento>",
  new_parent_id: "<ID de la carpeta destino>",  // omitir para solo renombrar
  new_name: "nuevo-nombre.md"                   // omitir para solo mover
})
```

---

### Paso 7 — Eliminar un elemento

> ⚠️ La eliminación mueve el elemento a la **papelera de reciclaje** del sitio SharePoint, no es irreversible inmediatamente.

```
sharepoint_delete_item({ site_id, item_id: "<ID del elemento>" })
```

**Antes de llamar a esta herramienta, siempre confirmar con el usuario** si el elemento es una carpeta (porque borra todo su contenido).

---

## Tabla de referencia rápida de herramientas

| Acción | Herramienta MCP | Parámetros clave |
|---|---|---|
| Obtener ID del sitio | `sharepoint_get_site` | `hostname?`, `site_path?` |
| Listar bibliotecas | `sharepoint_list_drives` | `site_id` |
| Listar carpeta | `sharepoint_list_items` | `site_id`, `folder_id?` |
| Buscar ficheros | `sharepoint_search_files` | `site_id`, `query` |
| Leer fichero texto | `sharepoint_read_file` | `site_id`, `item_id` |
| Subir texto | `sharepoint_upload_file` | `site_id`, `parent_id`, `file_name`, `content` |
| Subir fichero local | `sharepoint_upload_local_file` | `site_id`, `parent_id`, `local_path`, `file_name?` |
| Crear carpeta | `sharepoint_create_folder` | `site_id`, `parent_id`, `folder_name` |
| Mover/renombrar | `sharepoint_move_item` | `site_id`, `item_id`, `new_parent_id?`, `new_name?` |
| Eliminar | `sharepoint_delete_item` | `site_id`, `item_id` |

---

## Flujo típico: subir un documento Word generado localmente

```
1. sharepoint_get_site()                          → obtener site_id
2. sharepoint_list_items({ site_id })             → navegar hasta la carpeta destino
3. [Agente docx genera el fichero en /tmp/...]
4. sharepoint_upload_local_file({
     site_id,
     parent_id: "<ID carpeta>",
     local_path: "/tmp/documento.docx"
   })                                             → sube el fichero a SharePoint
```

---

## Notas sobre autenticación

- El MCP usa **Device Code Flow** (MSAL Node). La primera vez que se invoque una herramienta, aparecerá en el terminal un mensaje del tipo:
  ```
  Ve a https://microsoft.com/devicelogin e introduce el código: XXXX-XXXX
  ```
- El token se cachea en `~/.teams-graph-mcp-msal-cache.json` (permisos 600). Las sesiones posteriores se autentican silenciosamente hasta que el refresh token expire.
- El **Tenant ID** ya está configurado: `3048dc87-43f0-4100-9acb-ae1971c79395` (tenant `everisgroup.onmicrosoft.com`).
- El **Client ID** ya está configurado: `c9512ef5-2f33-4f63-bda1-848f9121444d`.
