---
name: migrar_documento_seat
description: "Migra un documento SEAT existente (Log de Cambios, DT o DF) al nuevo formato corporativo partiendo de la plantilla oficial correspondiente. Localiza y descarga automáticamente el fichero original desde SharePoint, extrae su contenido y lo transfiere al nuevo formato. Preserva el historial de versiones, los cambios aceptados y pendientes, y el índice del documento original."
agent: Agente_actualizacion_doc_SEAT
argument-hint: "Escribe el tipo (LC/DT/DF) y el nombre de la aplicación, p. ej: 'DT Proxy logs'"
---

## Instrucciones de comportamiento

Este prompt opera en **modo autónomo**: con el tipo de documento y el nombre de la aplicación el agente localiza el fichero original en SharePoint, lo descarga y extrae de él toda la información necesaria para la migración. **No pide al usuario que pegue ningún contenido**.

Al recibir el mensaje del usuario, extraer de él:
- **Tipo de documento**: `LC`, `DT` o `DF` (puede aparecer como texto libre: «Log de Cambios», «Documento Técnico», «Documento Funcional»).
- **Nombre de la aplicación**: el nombre del proyecto tal como lo escribe el usuario.

Si alguno de estos dos datos no puede inferirse del mensaje, mostrar **únicamente** el bloque de parámetros mínimo y esperar la respuesta del usuario. Una vez obtenidos, ejecutar directamente sin más preguntas salvo las excepciones indicadas más abajo.

**Excepciones que sí requieren una pregunta adicional:**
1. Si el tipo de documento no coincide con ninguno de los tres tipos soportados (LC, DT, DF).
2. Si el nombre de la aplicación no coincide con ningún proyecto en `sharepoint_docs_refs.md`, preguntar únicamente el proyecto de destino.
3. Si en la carpeta SharePoint del tipo indicado hay más de un documento cuya versión no puede determinarse por el nombre del fichero ni por `lastModifiedDateTime`.
4. Si el documento original descargado no contiene una tabla de control de versiones reconocible, informar al usuario y pedir que la proporcione.

Trabaja siempre en **modo seguro**:
- El nombre del fichero migrado siempre difiere del original (patrón `SEAT - [TIPO] [NOMBRE] v[X.X].docx`), por lo que no hay riesgo de sobreescritura directa sobre la plantilla o el original.
- Si en la carpeta de destino de SharePoint ya existe un fichero con el mismo nombre de salida, avisar al usuario y pedir confirmación antes de subir.
- No reutilices ficheros temporales de ejecuciones anteriores sin verificar que corresponden al proceso actual.

---

## Plantilla de parámetros mínima

Mostrar **solo si** el mensaje inicial no contiene el tipo o el nombre de la aplicación:

```
Tipo de documento *    : (LC / DT / DF)
Nombre de la aplicación *: 
Proyecto en SharePoint  : (opcional; si difiere del nombre de la aplicación)
```

---

## Procedimiento de migración

### 0 — Leer referencias SharePoint y autenticar
Leer `.github/sharepoint_refs.md` para obtener los Item IDs de las plantillas y los datos de autenticación.  
Autenticarse según el procedimiento del `Agente_actualizacion_doc_SEAT` (Paso 0 de ese agente).  
Leer también `.github/sharepoint_docs_refs.md` para identificar las carpetas del proyecto.

### 0.5 — Localizar y descargar el documento original

1. Buscar en `.github/sharepoint_docs_refs.md` la entrada del proyecto (comparación case-insensitive, coincidencia parcial aceptada con el nombre de la aplicación o el campo **Proyecto en SharePoint** si se proporcionó).
2. Usar el Item ID de la carpeta correspondiente al tipo de documento (`Carpeta LCs`, `Carpeta DTs` o `Carpeta DFs`) para listar su contenido con `mcp_teams-graph_sharepoint_list_items`.
3. De los ficheros listados, seleccionar el de **versión más alta** según la regla definida en `sharepoint_docs_refs.md`: número de versión en el nombre del fichero o, en su defecto, `lastModifiedDateTime` más reciente. Nunca trabajar sobre una versión antigua.
4. Descargar ese fichero con `mcp_teams-graph_sharepoint_read_file` y guardarlo en `/tmp/` con su nombre original.
5. Extraer del fichero descargado (descomprimiendo el `.docx` como ZIP y leyendo `word/document.xml`):
   - **Versión del documento**: buscar en la tabla de control de versiones la fila con la versión más alta (o leer el número de versión del nombre del fichero si está disponible).
   - **Tabla de Gestión de versiones completa**: todas las filas de la tabla de control de versiones.
   - **Índice / Tabla de contenido**: estructura de secciones y subsecciones.
   - **Contenido completo**: texto de todas las secciones del documento.
6. Si alguno de estos datos no puede extraerse automáticamente (tabla de versiones no reconocible, estructura de secciones ambigua), notificar al usuario únicamente los datos que faltan y pedirlos antes de continuar.

### 1 — Descargar la plantilla desde SharePoint
Usar el Item ID correspondiente al tipo de documento (extraídos de `.github/sharepoint_refs.md`) para descargar la plantilla con `mcp_teams-graph_sharepoint_read_file` y guardarla en `/tmp/`:

| Tipo | Item ID | Fichero local |
|---|---|---|
| `LC` | `01DSNDNNIXNXKGNSDK3JEZPBQVKIUCYQNA` | `/tmp/SEAT - LC PLANTILLA v1.0.docx` |
| `DT` | `01DSNDNNJDJXDTM5TUZRD3YQXARTKRQEJ5` | `/tmp/SEAT - DT PLANTILLA v1.0.docx` |
| `DF` | `01DSNDNNMC3TIY6Y2QSJGIUTKQBRLHU2DE` | `/tmp/SEAT - DF PLANTILLA v1.0.docx` |

Si la descarga falla, reportar el error y detener.

### 2 — Determinar el nombre del fichero de salida
Construir el nombre del fichero de salida siguiendo el patrón:
```
SEAT - [TIPO] [NOMBRE DE LA APLICACIÓN] v[versión].docx
```
El nombre de la aplicación se convierte siempre a **mayúsculas**. No se añade guion entre el tipo y el nombre de la aplicación.

Ejemplos:
- `SEAT - LC PROCEDIMIENTOS v1.6.docx`
- `SEAT - DT HR LAUNCHPAD v2.0.docx`
- `SEAT - DF JOB POSITION v1.3.docx`

La versión se extrae del documento original descargado en el paso 0.5 (tabla de control de versiones o nombre del fichero).

### 3 — Crear el documento de trabajo localmente
Crear una copia de la plantilla descargada en `/tmp/` con el nombre definitivo:
```
/tmp/SEAT - [TIPO] [NOMBRE DE LA APLICACIÓN] v[versión].docx
```
**Nunca** modificar la plantilla descargada directamente; trabajar siempre sobre esta copia.

### 4 — Recoger métricas del documento original (pre-flight)

**Antes de iniciar la transferencia de contenido**, extraer del documento original las métricas que se usarán para validar el resultado en el Paso 5. Esto permite detectar pérdida de contenido sin abrir Word.

```python
import zipfile, re
from lxml import etree

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
orig_path = "/tmp/<nombre_original>.docx"

with zipfile.ZipFile(orig_path, 'r') as z:
    doc_xml = z.read('word/document.xml')

tree = etree.fromstring(doc_xml)
body = tree.find(W + 'body')

METRICS = {
    'drawings':   len(list(tree.iter(W + 'drawing'))),
    'tables':     len(list(body.iter(W + 'tbl'))),
    'ttulo1':     sum(1 for p in tree.iter(W+'p')
                      if (p.find('.//' + W+'pStyle') is not None
                          and p.find('.//' + W+'pStyle').get(W+'val') == 'Ttulo1')),
    'ttulo2':     sum(1 for p in tree.iter(W+'p')
                      if (p.find('.//' + W+'pStyle') is not None
                          and p.find('.//' + W+'pStyle').get(W+'val') == 'Ttulo2')),
}
print(f"Pre-flight: {METRICS}")
# Guardar METRICS para el Paso 5
```

### 4b — Transferir el contenido al nuevo documento
Aplicar las instrucciones específicas según el tipo de documento (sección siguiente) y las instrucciones comunes (sección posterior).

### 5 — Validar y autofix con script Python (obligatorio antes de subir)

**No abrir Word para descubrir problemas.** Ejecutar el siguiente script sobre el fichero de salida antes de subir a SharePoint. El script detecta y corrige automáticamente los problemas corregibles; los no corregibles los reporta como errores que detienen el proceso.

```python
import zipfile, io, re
from lxml import etree

W   = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R   = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
out_path = "/tmp/SEAT - [TIPO] [NOMBRE] v[X.X].docx"
errors, fixes = [], []

with zipfile.ZipFile(out_path, 'r') as z:
    out_files = {n: z.read(n) for n in z.namelist()}

# ── 1. ZIP válido ──────────────────────────────────────────────
if not zipfile.is_zipfile(out_path):
    errors.append("ZIP no válido")

# ── 2. XML bien formado ────────────────────────────────────────
try:
    doc_tree  = etree.fromstring(out_files['word/document.xml'])
    sty_tree  = etree.fromstring(out_files['word/styles.xml'])
except etree.XMLSyntaxError as e:
    errors.append(f"XML malformado: {e}")

# ── 3. rIds huérfanos ──────────────────────────────────────────
doc_str  = out_files['word/document.xml'].decode('utf-8')
rels_str = out_files['word/_rels/document.xml.rels'].decode('utf-8')
refs     = set(re.findall(r'r:(?:id|embed|href)="(rId\d+)"', doc_str))
declared = set(re.findall(r'Id="(rId\d+)"', rels_str))
orphans  = refs - declared
if orphans:
    errors.append(f"rIds huérfanos: {sorted(orphans)}")

# ── 4. rIds duplicados en .rels ────────────────────────────────
all_ids = re.findall(r'Id="(rId\d+)"', rels_str)
dupes   = {x for x in all_ids if all_ids.count(x) > 1}
if dupes:
    errors.append(f"rIds duplicados en .rels: {dupes}")

# ── 5. sectPr usa rId12/rId13 de plantilla ─────────────────────
sect_pr = doc_tree.find('.//' + W + 'sectPr')
if sect_pr is not None:
    rels_tree = etree.fromstring(out_files['word/_rels/document.xml.rels'])
    def rel_target(rid):
        for rel in rels_tree:
            if rel.get('Id') == rid:
                return rel.get('Target', '')
        return ''
    hdr_rid = next((r.get(R+'id') for r in sect_pr.iter(W+'headerReference')), None)
    ftr_rid = next((r.get(R+'id') for r in sect_pr.iter(W+'footerReference')), None)
    if hdr_rid and 'header' not in rel_target(hdr_rid):
        errors.append(f"sectPr headerReference apunta a '{rel_target(hdr_rid)}' (esperado header*.xml)")
    if ftr_rid and 'footer' not in rel_target(ftr_rid):
        errors.append(f"sectPr footerReference apunta a '{rel_target(ftr_rid)}' (esperado footer*.xml)")

# ── 6. Imágenes preservadas (compara con METRICS del Paso 4) ───
drawings_out = len(list(doc_tree.iter(W + 'drawing')))
if drawings_out != METRICS['drawings']:
    errors.append(
        f"Pérdida de imágenes: original={METRICS['drawings']}, salida={drawings_out}")

# ── 7. Tablas preservadas ──────────────────────────────────────
tables_out = len(list(doc_tree.find(W+'body').iter(W+'tbl')))
if tables_out < METRICS['tables']:
    errors.append(
        f"Pérdida de tablas: original={METRICS['tables']}, salida={tables_out}")

# ── 7b. Orden abstractNum antes de w:num en numbering.xml ───────
if 'word/numbering.xml' in out_files:
    try:
        num_tree_v = etree.fromstring(out_files['word/numbering.xml'])
        num_tags = [(i, c.tag.split('}')[1]) for i, c in enumerate(num_tree_v)
                    if c.tag.split('}')[1] in ('abstractNum', 'num')]
        last_abstract = max((i for i, t in num_tags if t == 'abstractNum'), default=-1)
        first_num     = min((i for i, t in num_tags if t == 'num'),          default=99999)
        if last_abstract > first_num:
            errors.append(
                f"numbering.xml: abstractNum[{last_abstract}] aparece después de "
                f"w:num[{first_num}] — Word ignorará esos abstractNums (listas sin viñeta)")
    except Exception as e:
        errors.append(f"numbering.xml no parseable: {e}")

# ── 8. AUTOFIX: Calibri Cuerpo en styles.xml ──────────────────
BODY_STYLES = {'docDefaults','Normal','paragraph','Prrafodelista','NormalNegrita'}
def set_calibri_cuerpo(rf):
    for a in list(rf.attrib.keys()): del rf.attrib[a]
    rf.set(W+'asciiTheme', 'minorHAnsi'); rf.set(W+'eastAsiaTheme', 'minorEastAsia')
    rf.set(W+'hAnsiTheme', 'minorHAnsi'); rf.set(W+'cstheme',       'minorBidi')

n_fonts = 0
for style in sty_tree.iter(W+'style'):
    if style.get(W+'styleId','') in BODY_STYLES:
        for rf in style.iter(W+'rFonts'):
            set_calibri_cuerpo(rf); n_fonts += 1
# docDefaults
for rf in sty_tree.iter(W+'rFonts'):
    if rf.getparent() is not None and rf.getparent().tag == W+'rPr':
        gp = rf.getparent().getparent()
        if gp is not None and gp.tag == W+'docDefaults':
            set_calibri_cuerpo(rf); n_fonts += 1
if n_fonts: fixes.append(f"Calibri Cuerpo aplicado en {n_fonts} rFonts de styles.xml")

# ── 9. AUTOFIX: contextualSpacing en párrafo ──────────────────
for style in sty_tree.iter(W+'style'):
    if style.get(W+'styleId','') == 'paragraph':
        ppr = style.find(W+'pPr')
        if ppr is None:
            ppr = etree.SubElement(style, W+'pPr')
        if ppr.find(W+'contextualSpacing') is None:
            etree.SubElement(ppr, W+'contextualSpacing')
            fixes.append("contextualSpacing añadido al estilo paragraph")

xml_sty = etree.tostring(sty_tree, xml_declaration=True, encoding='UTF-8', standalone=True)
out_files['word/styles.xml'] = xml_sty.decode('utf-8').replace(
    "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', 1).encode('utf-8')

# ── 10. AUTOFIX: 11 pt → 12 pt en document.xml y styles.xml ──
n_sz = 0
for tree_name, tree_obj in [('document', doc_tree), ('styles', sty_tree)]:
    for tag in (W+'sz', W+'szCs'):
        for el in tree_obj.iter(tag):
            if el.get(W+'val') == '22':
                el.set(W+'val', '24'); n_sz += 1
if n_sz: fixes.append(f"11 pt → 12 pt: {n_sz} elementos corregidos")

for xml_key, tree_obj in [('word/document.xml', doc_tree), ('word/styles.xml', sty_tree)]:
    xml_bytes = etree.tostring(tree_obj, xml_declaration=True, encoding='UTF-8', standalone=True)
    out_files[xml_key] = xml_bytes.decode('utf-8').replace(
        "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>",
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', 1).encode('utf-8')

# ── Resultado ──────────────────────────────────────────────────
print("FIXES aplicados:", fixes if fixes else "ninguno")
if errors:
    print("ERRORES (detener migración):", errors)
    raise SystemExit(1)

# ── Reescribir ZIP con autofixes ───────────────────────────────
buf = io.BytesIO()
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zout:
    for name, data in out_files.items():
        zout.writestr(name, data)
buf.seek(0)
with open(out_path, 'wb') as f:
    f.write(buf.read())
print(f"✅ Validación OK — fichero listo para subir ({zipfile.is_zipfile(out_path)})")
```

Si el script termina con `SystemExit(1)`, **no subir** el fichero. Revisar los errores reportados, corregirlos en el script de migración principal y volver a ejecutar el Paso 4b desde cero.

### 6 — Identificar carpeta de destino en SharePoint
Usando la misma entrada de `.github/sharepoint_docs_refs.md` localizada en el paso 0.5:
1. Si hay más de una coincidencia o ninguna, preguntar al usuario cuál es el proyecto correcto antes de continuar.

Usar la **subcarpeta específica del tipo de documento** como destino, según el campo correspondiente de la tabla en `sharepoint_docs_refs.md`:

| Tipo | Campo a usar | Subcarpeta |
|---|---|---|
| `LC` | `Carpeta LCs` | `0. Logs de cambios` |
| `DT` | `Carpeta DTs` | `1. DT` |
| `DF` | `Carpeta DFs` | `2. DF` |

Si ese campo no existe para el proyecto, usar el campo `Carpeta "0. Documentación"` como fallback.

### 7 — Subir el documento migrado a SharePoint
Comprobar si ya existe en la carpeta de destino un fichero con el mismo nombre de salida usando `mcp_teams-graph_sharepoint_list_items`. Si existe, avisar al usuario y pedir confirmación antes de sobreescribir.

Subir el fichero local con `mcp_teams-graph_sharepoint_upload_local_file` a la carpeta de destino identificada en el paso anterior.

### 8 — Informar al usuario
- Comunicar la URL de SharePoint del documento subido.
- Confirmar que la plantilla de origen no ha sido modificada.
- Ofrecer eliminar los ficheros temporales en `/tmp/` tras la confirmación del usuario.

> 💡 **Tabla de contenidos**: Los números de página del índice no se actualizan automáticamente durante la migración. Para obtener las páginas correctas, abre el documento en **Microsoft Word**, haz clic derecho sobre el índice y selecciona **"Actualizar campos" → "Actualizar toda la tabla"**. Realiza este paso una vez que el documento esté completamente formateado por Word.

---

## Instrucciones específicas por tipo de documento

### Log de Cambios (LC)

- La sección principal de contenido es **CAMBIOS**. Cada versión del historial se convierte en un subapartado `Ttulo2` con el formato `v[X.X] — [descripción breve]`.
- La tabla de Gestión de versiones se inserta en la sección **GESTIÓN DE VERSIONES** usando el estilo `TablaSEAT2` con columnas: `Versión | Fecha | Autor | Descripción`.
- Los comentarios de versiones, si existen, se insertan como párrafos `paragraph` debajo de la tabla de versiones o dentro del subapartado correspondiente de la sección CAMBIOS.
- Preservar el orden cronológico de versiones (la más reciente primero si el original así lo tenía, o la más antigua primero si ese era el criterio original).
- **No modificar** el contenido de los cambios ya documentados: trasladarlos literalmente al nuevo formato.

### Documento Técnico (DT)

- Respetar la estructura de secciones del índice original, mapeando cada nivel a `Ttulo1` / `Ttulo2` / `Ttulo3` según corresponda.
- El apartado de **control de versiones** del DT se traslada a la sección equivalente de la plantilla usando `TablaSEAT2`.
- Los diagramas, tablas de datos técnicos y bloques de código que estén en el original se trasladan como párrafos `paragraph` o como nuevas tablas `TablaSEAT2` según su naturaleza.
- Si el original contiene una sección de **Descripción general** o **Introducción**, debe ser la primera sección de contenido tras el índice.
- Mantener intactas las decisiones de diseño y restricciones técnicas documentadas en el original.
- **⚠️ Ajuste de METRICS pre-flight**: la plantilla DT puede consolidar en 1 tabla elementos que el original tenía en 2 (p.ej. tabla de título de portada + tabla de control de versiones separadas). En ese caso, restar la diferencia de `METRICS['tables']` antes de usar el valor en la validación del Paso 5. Del mismo modo, si existen párrafos `Heading2` vacíos en el original (sin texto, `numId=0`) que el filtro de párrafos vacíos elimina, restar ese número de `METRICS['ttulo2']`.

### Documento Funcional (DF)

- Respetar la estructura de secciones del índice original, mapeando cada nivel a `Ttulo1` / `Ttulo2` / `Ttulo3` según corresponda.
- El apartado de **control de versiones** del DF se traslada a la sección equivalente de la plantilla usando `TablaSEAT2`.
- Los casos de uso, flujos de usuario y reglas de negocio se trasladan como párrafos `paragraph` o listas `Prrafodelista` manteniendo su redacción original.
- Las tablas de datos funcionales (campos, validaciones, permisos, etc.) se recrean con el estilo `TablaSEAT2`.
- Mantener intactas las reglas de negocio, restricciones y requisitos documentados en el original.

---

## Instrucciones comunes (todos los tipos)

> Las reglas de idioma, estilos, fuentes, Track Changes, modo seguro, validación e integridad estructural están en `.github/instructions/seat-docx.instructions.md`. A continuación, solo las instrucciones específicas del proceso de migración.

---

### Integridad estructural del DOCX resultante (prevención de corrupción)

Estas reglas previenen los errores que hacen que Word rechace o corrompa el documento al abrirlo. Aplicarlas **antes de escribir el ZIP final**, en el orden indicado.

**1 — Plantilla como documento raíz (obligatorio)**
El fichero de salida se construye **siempre** partiendo de `dict(tmpl_files)` — todos los ficheros ZIP de la plantilla como base — y añadiendo o sobreescribiendo únicamente los elementos necesarios del original. Nunca partir del ZIP original y aplicar la plantilla encima: ese enfoque arrastra rIds estructurales del original que colisionan con los de la plantilla y produce documentos corruptos.

**2 — Remapeo de rIds del contenido original**
La plantilla SEAT reserva `rId1`–`rId15` para sus relaciones estructurales (`rId12` → `header1.xml`, `rId13` → `footer1.xml`, `rId11` → logo de portada, etc.). Si el documento original también usa `rId11`–`rId15` para imágenes u otros recursos, **deben remapearse** antes de insertar el contenido en el nuevo documento.
- Estrategia estándar: `{'rId11':'rId52', 'rId12':'rId53', 'rId13':'rId54', 'rId14':'rId55', 'rId15':'rId56'}`.
- Aplicar el remapeo **solo** a los elementos del contenido copiado del original (atributos `r:id`, `r:embed`, `r:href`). Nunca tocar el `sectPr` ni los headers/footers de la plantilla.
- Añadir las nuevas relaciones en `word/_rels/document.xml.rels` con los rIds remapeados apuntando a los recursos originales.
- **⚠️ Parsear `.rels` con lxml, no con regex**: al leer el fichero `.rels` para extraer los rIds existentes y construir el mapa de remapeo, usar `etree.fromstring()` e iterar los elementos `Relationship`. La regex habitual `[^/>]+` falla en relaciones `TargetMode="External"` cuyas URLs contienen `/` (p.ej. hyperlinks HTTPS), haciendo que esos rIds no se procesen y el mapa de remapeo quede vacío — con el resultado de que ninguna imagen ni recurso del original se transfiere al documento migrado:
  ```python
  # CORRECTO — lxml (soporta URLs con '/' en TargetMode="External")
  rels_tree = etree.fromstring(rels_bytes)
  orig_rels = {
      rel.get('Id'): {'Id': rel.get('Id'), 'Type': rel.get('Type', ''),
                      'Target': rel.get('Target', ''),
                      'TargetMode': rel.get('TargetMode', '')}
      for rel in rels_tree if rel.get('Id')
  }
  # INCORRECTO — la regex [^/>]+ se detiene en '/' de las URLs:
  # re.finditer(r'<Relationship\s+([^/>]+)\s*/?>', rels_str)  ← no usar
  ```

**3 — Protección del `sectPr` de la plantilla**
El bloque `<w:sectPr>` de `word/document.xml` **siempre** debe provenir íntegramente de la plantilla. Sus referencias `rId12`/`rId13` (header/footer) deben mantenerse intactas. Nunca copiar ni modificar el `sectPr` del original. Al construir el documento con lxml, tomar el `sectPr` del árbol de la plantilla y posicionarlo como **último hijo** de `w:body` tras insertar todo el contenido del original.

**4 — Colisión de ficheros de media**
Antes de copiar los ficheros de media del original al ZIP de salida, verificar que no colisionan en nombre con los media de la plantilla. Los ficheros de la plantilla tienen **prioridad absoluta** (logo portada, logo cabecera). Los ficheros del original que compartan nombre con un media de la plantilla deben renombrarse (p.ej. `image2.png` → `image2_orig.png`) y actualizar sus referencias `r:embed` en el `document.xml` copiado.

**5 — Content-Types para formatos de imagen no estándar**
Verificar que `[Content_Types].xml` incluye entradas para todos los formatos de imagen presentes en el ZIP. El formato `.emf` (metafile de Windows) no está en la plantilla por defecto; si el original contiene ficheros `.emf`, añadir la entrada correspondiente antes de escribir el ZIP:
```xml
<Default Extension="emf" ContentType="image/x-emf"/>
```
Hacer lo mismo para `.wmf`, `.svg` u otros formatos que no estén ya declarados.

**6 — Validación de rIds huérfanos**
Antes de escribir el ZIP final, verificar que todos los `r:id` y `r:embed` referenciados en `word/document.xml` tienen una entrada en `word/_rels/document.xml.rels`. Un rId huérfano hace que Word muestre el documento como dañado o con imágenes rotas.
```python
import re, zipfile
with zipfile.ZipFile(out_path, 'r') as z:
    doc   = z.read('word/document.xml').decode('utf-8')
    rels  = z.read('word/_rels/document.xml.rels').decode('utf-8')
refs     = set(re.findall(r'r:(?:id|embed|href)="(rId\d+)"', doc))
declared = set(re.findall(r'Id="(rId\d+)"', rels))
orphans  = refs - declared
if orphans:
    raise ValueError(f"rIds huérfanos detectados: {orphans}")
```

**7 — Entradas duplicadas en `word/_rels/document.xml.rels`**
Verificar que no hay dos entradas con el mismo `Id` en el fichero `.rels`. Un rId duplicado provoca que Word rechace el documento. Al construir el `.rels` con lxml, usar un `dict` de `Id → Element` para garantizar unicidad antes de serializar.

**8 — Exclusión de artefactos ZIP no estándar**
Algunos documentos Word creados en Windows o macOS contienen metadatos en el ZIP que Word ignora pero que pueden interferir con la reescritura del fichero: `[trash]/0000.dat`, `__MACOSX/`, `.DS_Store`. Al leer el ZIP original con `{n: z.read(n) for n in z.namelist()}`, excluir estas entradas:
```python
EXCLUDE_PREFIXES = ('[', '__MACOSX', '.DS_Store')
orig_files = {n: z.read(n) for n in z.namelist()
              if not any(n.startswith(p) for p in EXCLUDE_PREFIXES)}
```

**9 — Orden correcto de `abstractNum` en `word/numbering.xml`**
En OOXML, todos los elementos `w:abstractNum` deben aparecer **antes** de los elementos `w:num` en `word/numbering.xml`. Word ignora silenciosamente los `abstractNum` colocados después de los `w:num`, haciendo que todas las listas que los referencien aparezcan sin viñeta ni numeración (los ítems muestran sangrado pero ningún carácter de bullet). Al copiar `abstractNum` del documento original al `numbering.xml` de la plantilla, **nunca usar `append()`**: calcular el punto de inserción antes del primer `w:num` o `w:numIdMacAtCleanup`:
```python
# Punto de inserción: antes del primer w:num o w:numIdMacAtCleanup
insert_pos = next(
    (i for i, c in enumerate(num_tree)
     if c.tag in (W + 'num', W + 'numIdMacAtCleanup')),
    len(list(num_tree))   # fallback: al final si no hay w:num todavía
)
for new_abs in new_abstractnums:
    num_tree.insert(insert_pos, new_abs)
    insert_pos += 1  # desplazar para el siguiente
```

---

### Preservación del historial de versiones
- La tabla de Gestión de versiones del documento original se traslada **íntegra** al nuevo documento: no se elimina ninguna fila, no se modifica ningún dato existente.
- Las versiones ya aceptadas y cerradas se marcan sin Track Changes (son parte del historial consolidado).
- Si el documento original tenía cambios pendientes de aceptar (Track Changes activo), estos se identifican en el contenido extraído automáticamente del original y se mantienen como Track Changes en el nuevo documento usando el sistema `w:ins` / `w:del` del agente.

### Control de revisiones (Track Changes) del documento original
- **Antes de migrar**, comprobar si el documento original tiene cambios rastreados. Para ello:
  1. Inspeccionar `word/settings.xml` y verificar si existe `<w:trackRevisions/>` (indica que Track Changes está **activo grabando** en el original).
  2. Contar elementos `w:ins` o `w:del` en `word/document.xml` (indican que hay cambios pendientes de aceptar aunque `trackRevisions` no esté presente).
- Si el original tiene `<w:trackRevisions/>` **o** contiene elementos `w:ins`/`w:del`:
  1. Añadir `<w:trackRevisions/>` al `word/settings.xml` del documento **migrado**, en la misma posición relativa que tenía en el original (normalmente después de `stylePaneFormatFilter`). Esto activa el control de cambios en Word al abrir el documento.
  2. Preservar en el contenido migrado todos los bloques `w:ins` y `w:del` existentes en los párrafos copiados del original (no aceptarlos ni rechazarlos durante la migración).
  3. Informar al usuario de que el documento migrado contiene cambios pendientes y de que deberá aceptarlos o rechazarlos desde Microsoft Word.
- Si no hay `<w:trackRevisions/>` ni `w:ins`/`w:del`, no añadir nada al `word/settings.xml` del migrado.
- **⚠️ Colisión de rIds en hyperlinks**: al copiar párrafos del original que contengan `<w:hyperlink r:id="rIdXX">`, verificar que esos `rId` no colisionen con los rIds de header/footer de la plantilla SEAT (`rId12` → `header1.xml`, `rId13` → `footer1.xml`). Si colisionan, añadir nuevas relaciones de tipo `hyperlink` con `TargetMode="External"` en `word/_rels/document.xml.rels` (usando rIds nuevos, p.ej. `rId16`, `rId17`…) y actualizar los atributos `r:id` de esos `<w:hyperlink>` en el document.xml.

### Estructura de secciones
- El índice del documento original es la referencia de estructura. Cada entrada del índice se convierte en el `Ttulo` del nivel correspondiente en el nuevo documento.
- La versión en la portada se actualiza con el número de versión del documento original.

### Portada — segunda línea del título
- La segunda línea de la portada (en la plantilla es `SEAT – Aplicación`) se actualiza a `SEAT – [NOMBRE DE LA APLICACIÓN]` (con guion largo `–`, no guion normal `-`).
- Al actualizar esta línea **no se elimina el párrafo completo**; se conserva íntegramente el `w:pPr` del template y el `w:rPr` del primer run **de la plantilla**. Solo se limpian los `w:r` existentes y se inserta uno nuevo con el `w:rPr` de la plantilla y el texto `SEAT – [NOMBRE]`.
- **⚠️ Nunca tomar el `w:rPr` del run del documento original para la portada.** El original puede tener color explícito (`w:color`) o fuente diferente heredada de su plantilla (p.ej. texto rojo). Usar siempre el `w:rPr` del run del **párrafo de portada de la plantilla** (`tmpl_kids[13].find(W+'r').find(W+'rPr')`). Incluir **obligatoriamente** la eliminación de cualquier `w:color` explícito del rPr copiado — aunque venga de la plantilla, puede contener color residual. Patrón completo e inamovible:
  ```python
  portada_p = tmpl_kids[13]
  tmpl_rpr  = portada_p.find(W+'r').find(W+'rPr')   # rPr de la PLANTILLA
  for run in list(portada_p.findall(W+'r')): portada_p.remove(run)
  new_run = etree.SubElement(portada_p, W+'r')
  if tmpl_rpr is not None:
      new_rpr = copy.deepcopy(tmpl_rpr)
      # Eliminar color explícito — el color lo define el estilo del párrafo
      for color_el in new_rpr.findall(W+'color'): new_rpr.remove(color_el)
      new_run.insert(0, new_rpr)
  t_el = etree.SubElement(new_run, W+'t')
  t_el.text = f'SEAT \u2013 {nombre_aplicacion}'
  ```
  > La eliminación de `w:color` **no es opcional**: sin ella, si el `w:rPr` de la plantilla (o del original, si se usase por error) contiene `<w:color w:val="CC0000"/>`, el texto aparecerá en rojo.

### Párrafo de Introducción — capitalización del nombre de la aplicación
- En el párrafo de la sección **INTRODUCCIÓN** el nombre de la aplicación se escribe con capitalización normal (no en mayúsculas completas), exactamente como lo proporcionó el usuario en el campo **Nombre de la aplicación**.
- Si el documento fuente contiene ese párrafo con el nombre en mayúsculas (p.ej. `WEBSCHOOL`, `USER MANAGEMENT`), normalizarlo al rellenar el texto del párrafo en el documento migrado.
- Ejemplo correcto: `"Este documento se utiliza para registrar todos los cambios realizados a la aplicación Web Escuela."` — no `WEB ESCUELA` ni `WEBESCUELA`.

### Listas en CAMBIOS
- Los ítems de lista del documento original tienen **dos niveles**: `ilvl=0` para cabeceras de bloque (p.ej. `Backend`, `SAP Build App`) y `ilvl=1` para los sub-ítems (ficheros/rutas). Ambos usan `numId=16` que ya existe en la plantilla con la misma estructura de viñetas.
- Los elementos `ListParagraph` del original **sin `numPr`** (líneas de descripción/continuación que empiezan por `–` o `-`) se trasladan como `Prrafodelista` también sin `numPr`, manteniendo el sangrado visual pero sin viñeta.
- **⚠️ Remapeo de `numId` inexistentes en la plantilla**: tras copiar los párrafos del original, verificar que todos los `numId` referenciados en los `w:numPr` existen en el `word/numbering.xml` de la plantilla. Si algún `numId` del original no existe en la plantilla, puede provocar que Word renderice las listas como listas numeradas en lugar de viñetas. Para cada `numId` huérfano, localizar en el `numbering.xml` de la plantilla un `abstractNum` con la misma definición de formato (`fmt=bullet`/`fmt=decimal`, `lvlText`, niveles) y remapar todos los `w:numId[@w:val='X']` de los párrafos copiados al `numId` equivalente de la plantilla. Ejemplo: si el original usa `numId=46` (bullet) y la plantilla no lo tiene pero sí tiene `numId=16` con la misma definición, hacer `numId=46 → numId=16` en todo el document.xml del resultado.
- **⚠️ `numId=46` recurrente en documentos de la familia Reccerticfcap**: los documentos que comparten la plantilla original `Reccerticfcap` (Payslip, Certificado Retenciones, NEF…) utilizan habitualmente `numId=46` para los párrafos de estilo `''` que se comportan como lista. Este `numId=46` **no existe** en la plantilla SEAT LC, por lo que siempre debe remapearse a `numId=16`. Incluir este remapeo como paso estándar de post-procesado al migrar cualquier documento de esta familia: iterar todos los `w:numId[@w:val='46']` del `document.xml` resultante y cambiarlos a `'16'`.
- **No arrastrar `numPr` del original a párrafos `Ttulo2`**: el estilo `Ttulo2` de la plantilla SEAT ya tiene su propio `numPr` (`numId=14`, `ilvl=1`, formato `%1.%2`) que genera la numeración `2.1`, `2.2`, etc. Si el párrafo del original que se convierte a `Ttulo2` tenía un `numPr` en su `w:pPr` (por ejemplo `numId=16` de lista de viñetas), **no copiarlo**: omitir ese `numPr` al establecer el estilo `Ttulo2`. Igualmente, no copiar ningún `w:ind` de párrafos-lista que se conviertan a `Ttulo2`, ya que el estilo define su propio sangrado.
- Los párrafos de cuerpo con estilo vacío (`''`) en el original se mapean a `paragraph`.
- La estrategia correcta es copiar directamente los elementos del original con `copy.deepcopy`, cambiando solo el `w:pStyle` (no los `w:rPr` de los runs, para que las fuentes del template tomen efecto).

### Estilos y formato

> Usar exclusivamente los estilos SEAT (`Ttulo1`–`Ttulo3`, `paragraph`, `NormalNegrita`, `Prrafodelista`, `TablaSEAT2`); ver reglas completas en `.github/instructions/seat-docx.instructions.md` (sección 2).

- **Calibri (Cuerpo) obligatorio en todo el contenido (excepto portada)**: tras construir el documento, corregir siempre `word/styles.xml` con la función `set_calibri_cuerpo()` sobre los estilos `docDefaults`, `Normal`, `paragraph`, `Prrafodelista` y `NormalNegrita`. Esto garantiza que el cuerpo del documento usa `minorHAnsi` (Calibri Cuerpo) y no Arial ni Times New Roman heredados de plantillas anteriores.
- **Sin espaciado automático en el estilo `paragraph`**: al definir el estilo `paragraph` en `styles.xml`, **no** incluir `w:beforeAutospacing` ni `w:afterAutospacing`. Usar únicamente `w:before="100"` y `w:after="100"` (5pt fijos). El `beforeAutospacing="1"` hace que Word calcule el espacio antes del párrafo según el contexto y puede añadir hasta 12pt de espacio automático tras un heading, creando una visible "caja vacía" entre el título y el texto. Los 5pt fijos dan una separación mínima consistente sin ese efecto. Añadir `<w:contextualSpacing/>` para suprimir el espaciado entre párrafos consecutivos del mismo estilo.
- **Línea vacía entre subsecciones en CAMBIOS**: insertar un párrafo vacío de estilo `paragraph` inmediatamente antes de cada `Ttulo2` dentro de la sección CAMBIOS, **excepto el primero**. El primer `Ttulo2` sigue directamente al `Ttulo1` sin párrafo vacío intermedio. Ejemplo de estructura correcta:
  ```
  Ttulo1: CAMBIOS
  Ttulo2: 2.1 Primer cambio       ← sin línea vacía antes
  ...contenido...
  [párrafo vacío]
  Ttulo2: 2.2 Segundo cambio      ← línea vacía antes
  ...contenido...
  ```
- **Párrafos vacíos entre párrafos de cuerpo consecutivos**: conservar **un único** párrafo vacío entre dos párrafos de cuerpo (`paragraph` / `Prrafodelista`) consecutivos cuando el original lo tenía. Este párrafo vacío actúa como línea en blanco visual entre bloques de texto. Reglas de post-procesado:
  - Eliminar párrafos vacíos que aparezcan **inmediatamente después de un heading** (`Ttulo1`, `Ttulo2`, `Ttulo3`); el heading ya tiene `w:spacing after` suficiente.
  - Colapsar **secuencias de más de un párrafo vacío consecutivo** a exactamente uno.
  - Conservar el párrafo vacío entre un párrafo de cuerpo y el heading siguiente (actúa como espacio visual previo al nuevo apartado).
  ```python
  HEADING_STYLES = {'Ttulo1', 'Ttulo2', 'Ttulo3'}
  def para_style(el):
      ps = el.find('.//' + W+'pStyle') if el.tag == W+'p' else None
      return ps.get(W+'val','') if ps is not None else ''

  filtered = []
  for elem in new_content:
      if is_empty(elem):
          prev_sty = para_style(filtered[-1]) if filtered else ''
          if prev_sty in HEADING_STYLES:   # vacío tras heading: descartar
              continue
          if filtered and is_empty(filtered[-1]):  # segundo vacío consecutivo: descartar
              continue
      filtered.append(elem)
  ```
- **⚠️ Definición de párrafo vacío (crítico)**: un párrafo se considera **vacío** si y solo si: (a) no contiene texto visible (ningún `w:t` con contenido no blanco) **y** (b) no contiene ningún elemento `w:drawing`. Los párrafos con solo imágenes **nunca** se eliminan. En código: `def is_empty(p): return not any((t.text or '').strip() for t in p.iter(W+'t')) and p.find('.//' + W + 'drawing') is None`.

> Para la limpieza de fuentes heredadas, ver `.github/instructions/seat-docx.instructions.md` (sección "Fuentes: Calibri (Cuerpo)") y la implementación completa en `Agente_actualizacion_doc_SEAT` (sección "Diagnóstico y corrección de fuentes"). Para el índice/TOC y el texto en MAYÚSCULAS de `Ttulo1`, ver las instrucciones sección 7 y 2 respectivamente.

### Imágenes en párrafo propio y párrafo vacío posterior
- **Imágenes siempre en su propio párrafo**: ninguna imagen (`w:drawing`) debe compartir párrafo con texto. Si al copiar el contenido un párrafo contiene runs de texto Y un run con `w:drawing`, dividirlo en dos párrafos: el texto primero (mismo estilo), la imagen después (estilo `paragraph`). Esto evita que la imagen aparezca inline a la derecha del texto en lugar de en una línea propia.
  ```python
  for el in list(body):
      if el.tag != W+'p' or not (has_drawing(el) and has_visible_text(el)):
          continue
      # Párrafo texto (quitar runs con drawing)
      text_p = copy.deepcopy(el)
      for r in list(text_p.findall(W+'r')):
          if r.find('.//' + W+'drawing') is not None: text_p.remove(r)
      # Párrafo imagen (solo el run con drawing)
      img_p = etree.Element(W+'p')
      ppr = etree.SubElement(img_p, W+'pPr'); ps = etree.SubElement(ppr, W+'pStyle')
      ps.set(W+'val', 'paragraph')
      for r in el.findall(W+'r'):
          if r.find('.//' + W+'drawing') is not None: img_p.append(copy.deepcopy(r))
      body.replace(el, text_p)  # texto en la posición original
      idx = list(body).index(text_p); body.insert(idx + 1, img_p)  # imagen después
  ```
- **Párrafo vacío después de cada imagen** (excepto si el siguiente elemento también es solo-imagen): insertar un párrafo vacío de estilo `paragraph` inmediatamente después de cada párrafo que contenga únicamente una imagen. Si dos imágenes son consecutivas, no insertar vacío entre ellas.
  ```python
  final = []
  for i, el in enumerate(list(body)):
      final.append(el)
      if is_image_only(el):
          next_el = body[i+1] if i+1 < len(body) else None
          if not is_image_only(next_el) and (next_el is None or next_el.tag != W+'sectPr'):
              final.append(make_empty_para())  # párrafo vacío separador
  ```
- **No aplicar las reglas anteriores a imágenes de la sección de portada** (todos los elementos del body que preceden al primer `Ttulo1`). Las imágenes de la portada son el logo SEAT y el icono corporativo; no deben tener párrafo vacío añadido ni se verán afectadas por el split.

### Bordes negros en imágenes
- Aplicar borde negro fino (0,75 pt) únicamente a imágenes del **contenido** (en o después del primer `Ttulo1`). Las imágenes de la portada **no** reciben borde.
  ```python
  # Encontrar índice del primer Ttulo1 en body
  first_ttulo1_idx = next(
      (i for i, el in enumerate(list(body))
       if el.find('.//' + W+'pStyle') is not None
       and el.find('.//' + W+'pStyle').get(W+'val') == 'Ttulo1'),
      0)
  for i, el in enumerate(list(body)):
      if i < first_ttulo1_idx: continue  # saltar portada
      for drawing in el.iter(W+'drawing'):
          sppr = drawing.find('.//{%s}spPr' % PIC_NS)
          if sppr is None: continue
          ln = sppr.find('{%s}ln' % A_NS)
          # Eliminar bordes incompletos (noFill, solidFill sin w/round)
          if ln is not None:
              has_solid = ln.find('{%s}solidFill' % A_NS) is not None
              has_round = ln.find('{%s}round' % A_NS) is not None
              if not (has_solid and has_round): sppr.remove(ln); ln = None
          if ln is None:
              # a:noFill es obligatorio entre prstGeom y a:ln según el esquema CT_ShapeProperties;
              # sin él, algunos renderizadores (Word Online, SharePoint preview) omiten el borde
              if sppr.find('{%s}noFill' % A_NS) is None:
                  prstGeom = sppr.find('{%s}prstGeom' % A_NS)
                  insert_pos = (list(sppr).index(prstGeom) + 1
                                if prstGeom is not None else len(list(sppr)))
                  sppr.insert(insert_pos, etree.Element('{%s}noFill' % A_NS))
              new_ln = etree.SubElement(sppr, '{%s}ln' % A_NS)
              new_ln.set('w', '9525'); new_ln.set('cmpd', 'sng'); new_ln.set('algn', 'ctr')
              sf = etree.SubElement(new_ln, '{%s}solidFill' % A_NS)
              etree.SubElement(sf, '{%s}srgbClr' % A_NS).set('val', '000000')
              etree.SubElement(new_ln, '{%s}round' % A_NS)
  ```
- **⚠️ Formato obligatorio**: usar siempre `cmpd="sng"` y `algn="ctr"` con `<a:round/>`. Sin `<a:round/>` el borde superior queda visualmente ausente. **Nunca** usar `cap="flat"`.
- **`wp:effectExtent` obligatorio en los 4 lados**: el borde `a:ln w="9525"` (0,75 pt) se dibuja sobre el contorno de la forma; la mitad exterior del trazo (~4762 EMUs) queda fuera del límite nominal de la imagen. Si cualquier lado del `wp:effectExtent` es `0`, Word recorta esa parte del borde haciéndolo invisible en ese lado. Tras añadir el borde, asegurar que los 4 lados del `wp:effectExtent` tienen al menos `19050` (1,5 pt):
  ```python
  WP = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}'
  MARGIN = 19050
  for i, el in enumerate(list(body)):
      if i < first_ttulo1_idx: continue  # saltar portada
      # Inline drawings
      for inline in el.iter(WP + 'inline'):
          ee = inline.find(WP + 'effectExtent')
          if ee is None:
              ee = etree.SubElement(inline, WP + 'effectExtent')
          for side in ('l', 't', 'r', 'b'):
              if int(ee.get(side, '0')) < MARGIN:
                  ee.set(side, str(MARGIN))
      # Anchor drawings (imágenes flotantes)
      for anchor in el.iter(WP + 'anchor'):
          ee = anchor.find(WP + 'effectExtent')
          if ee is None:
              ee = etree.SubElement(anchor, WP + 'effectExtent')
          for side in ('l', 't', 'r', 'b'):
              if int(ee.get(side, '0')) < MARGIN:
                  ee.set(side, str(MARGIN))
  ```
  > Aplicar este fix **después** de insertar los bordes `a:ln`, en el mismo paso.

### Estilo Hipervnculo en runs de hiperenlaces de contenido
- Los runs (`w:r`) que son hijos directos de `w:hyperlink` en el contenido del documento (no en el TOC `w:sdt`) deben llevar `<w:rStyle w:val="Hipervnculo"/>` en su `w:rPr` para que aparezcan subrayados y en azul.
- Aplicar este fix durante la construcción del árbol (antes de serializar):
  ```python
  for hl in new_elem.iter(W+'hyperlink'):
      for run in hl.findall('.//' + W+'r'):
          rpr = run.find(W+'rPr')
          if rpr is None:
              rpr = etree.SubElement(run, W+'rPr'); run.insert(0, rpr)
          rs = rpr.find(W+'rStyle')
          if rs is None:
              rs = etree.SubElement(rpr, W+'rStyle'); rpr.insert(0, rs)
          rs.set(W+'val', 'Hipervnculo')
  ```
- **Nota de validación**: al contar runs sin estilo, excluir los que estén dentro de un `w:sdt` (TOC), ya que esos usan el estilo propio de las entradas TDC y no necesitan `Hipervnculo`. El conteo esperado es: `runs sin estilo fuera de w:sdt == 0`.

### Remapeo de numIds con carácter de lista específico (guiones)
- Si el documento original usa `numId` que producen guiones (`w:lvlText w:val="-"`) y esos `numId` no existen en la plantilla (o la plantilla los tiene con un carácter diferente), Word renderiza las listas incorrectamente o muestra un error de "contenido no legible" si el `numId` es completamente huérfano.
- **Estrategia de remapeo**:
  1. Identificar los `numId` usados en el contenido copiado: `re.findall(r'<w:numId\s+w:val="(\d+)"', doc_str)`.
  2. Para cada `numId`, comprobar si existe en el `word/numbering.xml` de salida (plantilla base) y si tiene la misma definición de formato.
  3. Si un `numId` no existe en la plantilla, extraer su `abstractNum` del `numbering.xml` del original, añadirlo al `numbering.xml` de salida con un `abstractNumId` nuevo (p.ej. `50+`) y añadir la entrada `w:num` correspondiente con el mismo `numId` (si no colisiona) o con uno nuevo remapeado.
  4. Si el `numId` existe pero tiene diferente `lvlText` (p.ej. el original tiene `text='-'` y la plantilla tiene `text=''`), copiar igualmente la definición del original para preservar el carácter correcto.
- **Código de comprobación rápida**:
  ```python
  num_ids_doc = set(re.findall(r'<w:numId\s+w:val="(\d+)"', doc_str))
  num_ids_def = set(re.findall(r'<w:num\s+w:numId="(\d+)"', numbering_xml_str))
  huerfanos = num_ids_doc - num_ids_def - {'0'}
  if huerfanos:
      raise ValueError(f"numIds huérfanos: {huerfanos} — añadir definición o remapar")
  ```
- Añadir esta comprobación al script de validación del Paso 5 como check obligatorio.

### Limpieza de sobreescrituras de formato en tablas (TablaSEAT2)
- Las tablas copiadas del original pueden contener `w:tblBorders` en `w:tblPr` y `w:shd` (shading) en las propiedades de cada celda (`w:tcPr`). Estos valores explícitos sobrescriben el estilo `TablaSEAT2` y producen tablas visualmente incorrectas (bordes diferentes, fondos de color inesperados).
- Al procesar cada tabla copiada del original, aplicar:
  ```python
  # Estilo corporativo
  ts = tpr.find(W+'tblStyle') or etree.SubElement(tpr, W+'tblStyle')
  ts.set(W+'val', 'TablaSEAT2')
  # Eliminar sobreescrituras / Remove overrides
  for brd in tpr.findall(W+'tblBorders'): tpr.remove(brd)
  for lk  in tpr.findall(W+'tblLook'):    tpr.remove(lk)
  for tc in tbl.iter(W+'tc'):
      tcpr = tc.find(W+'tcPr')
      if tcpr is not None:
          for shd in tcpr.findall(W+'shd'):      tcpr.remove(shd)
          for cb  in tcpr.findall(W+'tcBorders'): tcpr.remove(cb)
  ```
- Verificar tras el procesado: `sum(1 for t in tree.iter(W+'tblPr') if t.find(W+'tblBorders') is not None) == 0`.

### Espaciado en párrafos dentro de celdas de tabla
- El estilo `paragraph` tiene `w:before="100" w:after="100"` (5 pt por lado). Las celdas de tabla heredan este espaciado y, en filas con poco contenido o vacías, producen filas significativamente más altas que en la plantilla original (~10 pt extra por celda).
- Al procesar **todas** las tablas (tanto la tabla de Gestión de versiones de la plantilla como las tablas copiadas del original), añadir explícitamente `w:spacing w:before="0" w:after="0"` a cada párrafo dentro de cada celda (`w:tc`):
  ```python
  for tc in tbl.iter(W + 'tc'):
      for p in tc.findall(W + 'p'):
          pPr = p.find(W + 'pPr')
          if pPr is None:
              pPr = etree.Element(W + 'pPr'); p.insert(0, pPr)
          sp = pPr.find(W + 'spacing')
          if sp is None:
              sp = etree.SubElement(pPr, W + 'spacing')
          sp.set(W + 'before', '0'); sp.set(W + 'after', '0')
          for attr in (W + 'beforeAutospacing', W + 'afterAutospacing'):
              if attr in sp.attrib: del sp.attrib[attr]
  ```
- Aplicar este bloque inmediatamente después de limpiar los `tblBorders` y `shd` de cada tabla.
- **⚠️ `contextualSpacing` no ayuda aquí**: la propiedad `contextualSpacing` suprime el espaciado entre párrafos consecutivos del mismo estilo, pero no tiene efecto dentro de celdas de tabla (cada celda es un contexto de párrafo aislado). El override explícito de `before/after` es la única solución.

### Columnas de la tabla de Gestión de versiones
- La plantilla SEAT tiene la tabla de versiones con columnas: **Versión | Fecha | Autor | Comentarios**.
- Al extraer datos del documento original para poblar esta tabla, mapear correctamente:
  - **Columna 0 (Versión)** → número de versión (p.ej. `1.0`, `1.6`, `2.3`), no el comentario.
  - **Columna 1 (Fecha)** → fecha en formato `DD/MM/YYYY`.
  - **Columna 2 (Autor)** → nombre del autor o empresa.
  - **Columna 3 (Comentarios)** → descripción del cambio o comentario (p.ej. `Version inicial`, `Revisión de contenidos`).
- El documento original puede tener un orden de columnas diferente (p.ej. `Versión(*) | Fecha | Autor | Revisión | Comentarios(*)`). Leer el encabezado de la tabla del original para identificar qué columna contiene el número de revisión antes de asignarlo.

### Construir `.rels` como string (evitar xmlns duplicado)
- Al añadir nuevas relaciones al fichero `word/_rels/document.xml.rels` usando `etree.SubElement`, lxml puede añadir una declaración `xmlns=` redundante en cada elemento `<Relationship>` nuevo, produciendo un XML inválido que Word rechaza.
- **Estrategia segura**: construir el fichero `.rels` completo como string, no con lxml:
  ```python
  REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
  rels_lines = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      f'<Relationships xmlns="{REL_NS}">',
  ]
  for attrs in sorted(all_rels.values(), key=lambda x: int(re.sub(r'\D','',x.get('Id','0')))):
      parts = [f'Id="{attrs["Id"]}"', f'Type="{attrs.get("Type","")}"',
               f'Target="{attrs.get("Target","")}"']
      if attrs.get('TargetMode'): parts.append(f'TargetMode="{attrs["TargetMode"]}"')
      rels_lines.append(f'<Relationship {" ".join(parts)}/>')
  rels_lines.append('</Relationships>')
  out_files['word/_rels/document.xml.rels'] = '\n'.join(rels_lines).encode('utf-8')
  ```
- Verificar: `rels_str.count('xmlns=') == 1` (solo la declaración raíz).
