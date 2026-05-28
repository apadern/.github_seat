---
name: generar_log_de_cambios
description: "Genera un log de cambios para un proyecto UI5 e inserta el resultado en el documento Word almacenado en SharePoint/Teams. Si el proyecto no tiene log de cambios en Teams, descarga la plantilla SEAT LC desde la carpeta de Plantillas corporativa. Presenta una plantilla con todos los parámetros de una sola vez para que el usuario los rellene en un único mensaje."
agent: Agente_actualizacion_doc_SEAT
argument-hint: "Escribe 'iniciar' para ver la plantilla de parámetros"
---

## Instrucciones de comportamiento

Al recibir cualquier mensaje de inicio (por ejemplo `iniciar`), detecta si el usuario ha indicado que quiere ejecutarlo **sin descripción** (por ejemplo: `iniciar sin descripción`, `sin descripción`, `modo corto`, `solo tabla`, `sin explicaciones` o cualquier expresión equivalente).

- **Con descripción** (por defecto): presenta la plantilla completa con el texto explicativo de cada campo tal como aparece a continuación.
- **Sin descripción**: presenta **únicamente el bloque de tabla** al final de la sección "Plantilla de parámetros" — sin los títulos de campo ni las explicaciones individuales — para que el usuario lo copie y rellene directamente.

En ambos casos, no hagas preguntas por separado: muestra el bloque correspondiente de una sola vez y espera a que el usuario lo devuelva relleno.

Una vez recibida la plantilla rellena, ejecuta el análisis directamente sin hacer más preguntas, salvo las dos excepciones indicadas más abajo.

**Excepción que sí requiere una pregunta adicional tras recibir la plantilla:**
1. Si algún campo obligatorio (`*`) viene vacío o con el texto de ejemplo sin modificar, solicitar únicamente ese campo.

Trabaja siempre en **modo seguro**:
- descarga el fichero de SharePoint a una ruta temporal local;
- crea una copia `_backup` del original descargado antes de modificarlo;
- valida la copia modificada antes de subirla de vuelta a SharePoint;
- no reutilices copias temporales de ejecuciones anteriores sin comprobar que corresponden al fichero origen actual.

---

## Plantilla de parámetros

Cuando el usuario active el prompt, muestra exactamente este bloque:

---

Lee los campos a continuación, después **copia el bloque al final y devuélvelo relleno en un solo mensaje**. Los marcados con `*` son obligatorios. Deja en blanco los opcionales que no apliquen.

---

**Proyecto** `*`  
Nombre de la carpeta raíz del proyecto dentro del workspace local.  
_Ejemplo: `seatnoconformidadescfui5`, `procedurescfui5`, `hrconfigui5`_

---

**Origen** `*`  
Indica qué cambios quieres documentar:  
· `1` — **Cambios sin commit**: analiza los cambios actuales no commiteados respecto al último commit (`git diff HEAD`). Útil cuando estás trabajando en una tarea y quieres documentar lo que llevas hecho.  
· `2` — **Comparar ramas**: compara la rama actual contra otra rama base (`git diff <rama-base>...HEAD`). Útil para documentar todo lo que se ha desarrollado en una rama de feature antes de hacer merge.

---

**Rama base** _(solo si Origen = 2)_  
Nombre de la rama contra la que comparar. La rama en la que estás trabajando se detecta automáticamente.  
_Ejemplo: `prod`, `main`, `develop`, `master`_

---

**Título de sección** `*`  
Título exacto del subapartado que se creará (o se reutilizará) dentro del fichero para insertar el log.  
Si ya existe una sección con ese título o con el mismo identificador de ticket, el contenido se añade dentro sin duplicarla.  
_Ejemplo: `BTPHR-1059 Corrección validación de firma`, `Sprint 14 — Semana 2`_

---

📋 **Copia este bloque, rellénalo y responde:**

```
Proyecto *            : 
Origen *              : 
Rama base             : 
Título de sección *   : 
```

---

## Plantilla corporativa LC — descubrimiento y registro

Antes de cualquier ejecución, lee `.github/sharepoint_refs.md` con `read_file` para obtener la configuración de SharePoint.

Si la sección `## Carpeta: Plantillas SEAT LC` del fichero contiene `_(pendiente — …)_` en el campo **Drive Item ID carpeta**, ejecuta el siguiente procedimiento **una sola vez**:

1. Usando `mcp_teams-graph_sharepoint_list_items` sobre la carpeta `General` (`01DSNDNNIXK72ETDN5RBF3H5366EV3MTJW`), localiza la subcarpeta `2. Materiales Adicionales`.
2. Dentro de ella, localiza la subcarpeta `Plantillas`.
3. Registra el **Drive Item ID** de esa carpeta en `.github/sharepoint_refs.md` sustituyendo el valor `_(pendiente — el agente lo registra en la primera ejecución)_` por el ID real.
4. Opcionalmente, si puedes obtener el **Item ID** del fichero `SEAT - LC PLANTILLA v1.0.docx` dentro de esa carpeta, regístralo también en el campo **Item ID plantilla**.
5. Confirma al usuario: _"Carpeta de Plantillas registrada en `.github/sharepoint_refs.md`"_.

Si el ID ya está registrado (no contiene `_(pendiente…)_`), omite este paso y usa directamente el ID almacenado.

### Cuándo usar la plantilla

Si el proyecto indicado por el usuario **no tiene un fichero LC en SharePoint**, descarga la plantilla desde la carpeta de Plantillas y úsala como base para crear un nuevo log de cambios. Tras modificarla localmente, súbela a la carpeta del proyecto en SharePoint con el nombre `SEAT - LC <NOMBRE_PROYECTO> v1.0.docx`.

> **Verificación estructural obligatoria al usar la plantilla**: antes de insertar contenido, comprobar en `word/document.xml` estos cuatro puntos:
> 1. **Estructura del campo TOC**: los tres marcadores `fldChar` (`begin`, `instrText`, `separate`) deben estar dentro del **mismo párrafo** (`<w:p>`). Si aparecen en tres párrafos separados, consolidarlos en uno solo — de lo contrario, la primera entrada del índice no mostrará los puntos guía (`......`) aunque el estilo `TDC1` los defina correctamente.
> 2. **Atributo `dirty` en el TOC**: verificar que el `<w:fldChar w:fldCharType="begin"/>` del TOC **no tiene** el atributo `w:dirty="true"`. Si lo tiene, eliminarlo. De lo contrario, Word mostrará el diálogo «¿Actualizar los campos?» cada vez que el documento se abra.
> 3. **Altura uniforme en la tabla de versiones**: al rellenar la tabla `TablaSEAT2` de gestión de versiones, aplicar `<w:spacing w:before="0" w:after="0"/>` al párrafo de **todas** las celdas de datos (filas 1+), incluyendo las que quedan vacías. Sin este atributo explícito, las filas vacías heredan el espaciado del estilo `paragraph` (100/100 twips) y aparecen visualmente más altas que las filas rellenas.
> 4. **Archivos de media sin Content-Type registrado**: `[Content_Types].xml` solo registra por defecto las extensiones `png`, `rels` y `xml`. Si al construir el ZIP de salida se incluyen ficheros de `word/media/` con extensión `.emf` o `.wmf` (habituales en documentos creados con versiones antiguas de Word), Word lanzará el error «contenido no legible» al abrir el resultado. Antes de subir, verificar que ningún fichero del ZIP tiene una extensión sin Content-Type asociado; eliminar los que no estén registrados si no son referenciados.

---

## Directrices de inserción en `.docx` (LC)

> Las reglas de estilos, estructura, Track Changes, modo seguro, fuentes, validación y reglas técnicas de edición DOCX están en `.github/instructions/seat-docx.instructions.md` (secciones 2–10). A continuación, solo las reglas específicas de este prompt LC.

### Ubicación dentro del documento
El contenido **siempre** se inserta dentro de la sección `CAMBIOS` (`Ttulo1`) como un nuevo subapartado. Nunca fuera de ella.

El nuevo subapartado se inserta al **final** de la sección `CAMBIOS`: justo antes del siguiente `Ttulo1` que la suceda o, si no hay ninguno, justo antes de `w:sectPr`.

Antes de insertar un nuevo `Ttulo2`, comprobar en este orden:
- coincidencia exacta del título completo;
- coincidencia por identificador de ticket (por ejemplo `BTPHR-1059`);
- coincidencia normalizada ignorando mayúsculas/minúsculas, dobles espacios y signos menores.

> **Crítico — cómo buscar**: la búsqueda del identificador de ticket **debe hacerse exclusivamente sobre el texto visible extraído de los `<w:t>` de párrafos con `<w:pStyle w:val="Ttulo2"/>`**, nunca sobre el XML en bruto del documento. Buscar en el XML completo produce falsas coincidencias con atributos como `w14:paraId`, `w:rsidR`, etc., que pueden contener los mismos dígitos que el número de ticket.

Ejemplo correcto en Python:
```python
for m in re.finditer(r'<w:pStyle w:val="Ttulo2"/>', content):
    p_start = content.rfind('<w:p ', 0, m.start())
    p_end   = content.find('</w:p>', p_start) + 6
    block   = content[p_start:p_end]
    text    = ''.join(re.findall(r'<w:t[^>]*>([^<]+)</w:t>', block))
    if 'BTPHR-795' in text:  # coincidencia sobre texto visible, no XML raw
        # sección encontrada → reutilizar
```

Si ya existe una coincidencia por ticket, no crear un nuevo `Ttulo2`: reutilizar la sección existente.

> **Importante**: si el `Ttulo2` candidato existe pero su texto está íntegramente dentro de elementos `w:del` (es decir, es una eliminación pendiente de aceptar), considerarlo como **no existente** y crear un nuevo `Ttulo2` con el título completo.

### Calcular `w:id` de partida

Al calcular el `w:id` máximo para los `w:ins`, leer directamente el ZIP del fichero que se va a modificar en ese momento (`zipfile.ZipFile(path_actual).read('word/document.xml')`), nunca sobre un backup ni una copia de sesión anterior. En caso de fusión con una versión remota (paso 6b), calcular el máximo sobre la versión remota descargada, no sobre el backup original.

---

## Paso — Autor de los cambios

Llama a `mcp_teams-graph_graph_get_current_user` para obtener el `displayName` del usuario de Teams autenticado. Usa ese valor como `w:author` en todas las marcas de revisión del documento. No preguntes al usuario por su nombre.

---

## Ejecución

Una vez recogidos todos los parámetros:

### 1. Leer referencias SharePoint
Lee `.github/sharepoint_refs.md` para obtener el `site_id`, la carpeta de Plantillas y los demás identificadores. Si la carpeta de Plantillas tiene IDs pendientes, ejecuta el procedimiento de descubrimiento descrito en "Plantilla corporativa LC — descubrimiento y registro".

### 2. Localizar el fichero LC en SharePoint
Sigue este orden estricto para localizar el LC:

**2.1 Buscar en la carpeta canónica** (`0. Logs de cambios`):
En el fichero `.github/sharepoint_refs.md`, busca la entrada del proyecto indicado. Si existe una sección con la ruta `<módulo>/0. Documentación/0. Logs de cambios`, usa el **Drive Item ID** de esa carpeta y lista su contenido con `mcp_teams-graph_sharepoint_list_items`.

- Si la sección no existe o los IDs no están registrados → pasar al punto 2.2.
- Si la carpeta `0. Logs de cambios` existe y contiene ficheros LC → seleccionar **la versión más alta** (comparar número de versión, p. ej. `v1.2 > v1.1 > v1.0`; si no hay versión explícita, usar `lastModifiedDateTime` más reciente).

**2.2 Búsqueda por nombre en SharePoint** (si 2.1 no resolvió):
Usa `mcp_teams-graph_sharepoint_search_files` con un patrón que combine el nombre del proyecto y `LC` o `Log de Cambios`.

- Si la búsqueda devuelve resultados en varias carpetas, **preferir siempre el fichero ubicado en una ruta que contenga `0. Logs de cambios`** frente a los que estén en subcarpetas de subproyectos u otras ubicaciones.
- Si hay varias versiones del mismo LC: seleccionar **siempre la de versión más alta**.
- Registra el **Drive Item ID** de la carpeta encontrada en `.github/sharepoint_refs.md` para futuras ejecuciones.

**2.3 Si no se encuentra ningún LC**:
Preguntar al usuario: _"No he encontrado un LC para el proyecto `<proyecto>` en SharePoint. ¿Puedes indicarme el nombre exacto del fichero o la ruta donde se encuentra?"_

Si el usuario confirma que no existe y quiere crearlo:
- Descarga la plantilla `SEAT - LC PLANTILLA v1.0.docx` desde la carpeta de Plantillas.
- **Antes de subir el nuevo LC**, avisa al usuario: _"Voy a crear el fichero `SEAT - LC <PROYECTO> v1.0.docx` en la carpeta `0. Logs de cambios` del proyecto. ¿Confirmas?"_. Espera respuesta explícita.
- **No crear carpetas** (`0. Documentación`, `0. Logs de cambios`) sin autorización explícita del usuario. Si la carpeta de destino no existe, informar al usuario y pedirle que la cree manualmente o que autorice su creación.

### 3. Obtener el diff local
Aplica siempre estos valores fijos:
- Desglose por fichero + método/vista cuando se detecte: **sí**
- Incluir ficheros eliminados/renombrados: **sí**
- Rutas: **relativas**

Obtén el diff en **dos fases** para evitar timeouts por exceso de output:

**Fase 3a — lista de ficheros modificados:**
```bash
# Sin commit:
git status --short
# Entre ramas:
git diff <rama-base>...HEAD --name-status
```

**Fase 3b — diff por grupos de 3-4 ficheros relacionados:**
```bash
# Repetir por grupos hasta cubrir todos los ficheros de la fase 3a:
git diff <rama-base>...HEAD -- fichero1 fichero2 fichero3 \
  | grep -E "^(diff --git|@@|[+-][^+-])" \
  | grep -v "^--- " | grep -v "^+++ " \
  | head -150
```

> **Por qué por grupos**: `git diff` sin filtro puede superar el límite del buffer del terminal y fallar silenciosamente. Dividir en grupos de ficheros relacionados garantiza que el output se procesa completo.

Analiza cada fichero modificado e infiere el elemento interno (controlador, vista, fragmento, modelo, utils) cuando sea posible.

### 4. Insertar el log en el `.docx`
Sigue las directrices de inserción de la sección anterior. Genera la salida en tres niveles de lista dentro del bloque `Frontend`:
- Nivel 0 (`- `): bloque `Frontend`.
- Nivel 1: ruta relativa del fichero seguida de `:`.
- Nivel 2: `` `nombreMétodo` `` en backticks + ` – descripción única` que consolida todos los cambios del método en una sola frase.

Un método = una única línea de nivel 2. Mantener el mismo orden que devuelve el diff.

### 5. Validar el resultado
Antes de subir, aplica todas las validaciones:
1. `word/document.xml` es XML bien formado.
2. El bloque insertado está dentro de `CAMBIOS` y no fuera.
3. El nuevo contenido queda antes de `w:sectPr`.
4. El texto visible del bloque insertado contiene el título del ticket y la entrada `Frontend` esperada. La búsqueda debe hacerse **a partir de la posición del `Ttulo2` del ticket**, no desde el inicio.
5. El número de `Ttulo1` y `Ttulo2` no disminuye respecto al documento origen.
6. Los `w:id` recién asignados (≥ `max_id_original + 1`) son únicos entre sí. **Usar el patrón `<w:ins[^>]+w:id="(\d+)"` para extraer solo IDs de Track Changes** — no el patrón genérico `w:id="(\d+)"`, que capturaría también bookmarks, comentarios y campos, produciendo falsos positivos.
7. Si falla cualquier validación, conservar el original en SharePoint y entregar solo el fichero local de diagnóstico.
8. Si el documento tiene un TOC (`w:sdt` con entradas `TDC`): (a) confirmar que `fldChar begin/instrText/separate` están en un único párrafo; (b) confirmar que `fldChar begin` no tiene `dirty="true"`. Corregir ambos antes de subir si no se cumple alguna condición.
9. Si el ZIP fue reconstruido mediante un `dict` (patrón `all_files = {n: z.read(n) for n in z.namelist()}`), verificar que todas las extensiones presentes en `word/media/` tienen un `Default` en `[Content_Types].xml`. Las extensiones `.emf` y `.wmf` **no están registradas** en la plantilla SEAT y provocan «contenido no legible». Eliminarlas del dict antes de escribir el ZIP si no son referenciadas en ningún `.rels`.

### 6. Subir a SharePoint
Usa `mcp_teams-graph_sharepoint_upload_local_file` para subir el fichero modificado al mismo ítem de SharePoint del que se descargó.

Si la subida devuelve `CONFLICT_DETECTED` (eTag obsoleto), ejecuta el **Paso 6b** antes de continuar.

Tras la subida exitosa, comunica al usuario:
- URL del ítem en SharePoint para revisión.
- Ruta del backup local `/tmp/..._backup.docx`.
- Pregunta: ¿quieres que elimine los ficheros temporales generados? (lista los paths).

### 6b. Gestión de conflicto eTag
Si `sharepoint_upload_local_file` devuelve `CONFLICT_DETECTED`:
1. Descarga la versión actual del fichero desde SharePoint a `/tmp/..._remote.docx`.
2. Compara párrafos del remote vs el `_backup` original para identificar los cambios ajenos (posiciones que difieren entre remote y backup).
3. **Si los cambios ajenos no solapan con el bloque insertado** → fusión automática:
   - Extrae el bloque insertado del fichero local usando `rfind(anchor_key, 0, idx_sectPr)`.
   - Recalcula el offset de IDs: `offset = max_id_remote - max_id_original`.
   - Renumera los `w:ins` del bloque: `new_id = old_id + offset`.
   - Re-inserta el bloque renumerado en la versión remota antes de `w:sectPr`.
4. **Si hay solapamiento** → informar al usuario con los párrafos en conflicto y detener sin modificar SharePoint.
5. Valida el fichero merged (mismas validaciones del paso 5).
6. Obtén el nuevo eTag con `mcp_teams-graph_sharepoint_list_items` y reintenta la subida con el `if_match` actualizado.

### 7. Limpieza opcional
Una vez confirmada la subida, proponer al usuario eliminar:
- El fichero temporal descargado desde SharePoint (`/tmp/...docx`).
- El backup local (`/tmp/..._backup.docx`).
- Scripts auxiliares creados en `/tmp/`.

---

## Validación obligatoria para `.docx`

_(ver paso 5 de la sección "Ejecución")_

## Índice (`TOC`) en `.docx`

- No insertar ni actualizar el índice salvo que el usuario lo pida explícitamente.
- No afirmar que el índice está actualizado si no se ha ejecutado una herramienta que refresque campos de Word/LibreOffice.

---

## Reglas

- No inventar cambios: basarse únicamente en el diff real.
- **Listar todos los ficheros modificados sin excepción**, independientemente de su tipo: `.js`, `.xml`, `.css`, `.properties` (i18n), imágenes, `.json`, `.yaml`, `.html`, etc.
- Crear **solo** el apartado `Frontend`: todos los cambios (incluidos los de backend) se documentan dentro de ese bloque.
- Priorizar claridad y brevedad en cada descripción.
- Agrupar por fichero y mantener orden estable (mismo orden que devuelve el diff).
- **Siempre** marcar cada párrafo nuevo con dos `w:ins` separados (uno en `w:pPr/w:rPr` y otro envolviendo `w:r`) con autor, `w:date` (hora local) y `w16du:dateUtc` (hora UTC), independientemente de si el documento ya tiene Track Changes activos.
- Cada párrafo consume 2 `w:id` consecutivos. No reutilizar `w:id` ni `w:author` de revisiones existentes.
- No considerar exitosa una edición de `.docx` únicamente porque el XML haga parse: la validación semántica del contenido insertado es obligatoria.
- No subir a SharePoint sin haber validado el fichero localmente primero.
