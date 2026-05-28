---
applyTo: '**'
---

# Documentos Word SEAT — Reglas de formato y edición

Aplicar estas reglas siempre que se cree, modifique o migre un documento Word (`.docx`) en formato corporativo SEAT. El agente responsable de ejecutar estas operaciones es `Agente_actualizacion_doc_SEAT`. Los prompts de tareas frecuentes son `generar_log_de_cambios` y `migrar_documento_seat`.

---

## 1. Idioma del contenido

- Todos los documentos SEAT se redactan en **español**.
- Si el texto origen está en inglés (total o parcialmente), **traducirlo** al español: cuerpo de párrafos, títulos de secciones, textos de tabla, listas.
- **No traducir**: rutas de ficheros, URLs, comandos de terminal, bloques de código, nombres de servicios BTP, identificadores técnicos, nombres de variables, claves de configuración.
- Secciones con títulos estándar en inglés → mapear a equivalente español SEAT (en MAYÚSCULAS para `Ttulo1`):

| Original (inglés) | SEAT (español) |
|---|---|
| Architecture Outline | ARQUITECTURA DEL PROYECTO |
| Context View | Vista de contexto |
| Instances | Instancias en BTP |
| General Information | Información general |
| Introduction / Objective | INTRODUCCIÓN |

- **No modificar** el contenido ya existente en la plantilla: encabezados de tabla de versiones, texto del TOC, texto de portada.

---

## 2. Sistema de estilos SEAT

Solo usar estilos del conjunto SEAT. **Nunca** `Heading1`, `Normal`, `ListParagraph` estándar de Word.

### 2.1 Estilos de párrafo

| `w:pStyle` | Propósito | Tamaño | Notas |
|---|---|---|---|
| `Ttulodendice` | Título de índice / portada de sección | 18 pt, negrita | Color rojo `#CC0000` |
| `Ttulo1` | Sección principal | 16 pt, negrita | **Texto en MAYÚSCULAS explícitas** en los `w:t` |
| `Ttulo2` | Subsección | 14 pt, negrita | — |
| `Ttulo3` | Sub-subsección | 13 pt, negrita | — |
| `paragraph` | Párrafo de cuerpo normal | 12 pt | Sin `beforeAutospacing` / `afterAutospacing`; añadir `<w:contextualSpacing/>` |
| `NormalNegrita` | Párrafo de cuerpo en negrita | hereda | — |
| `Prrafodelista` | Elemento de lista | 12 pt | Requiere `w:numPr` |
| `TDC1` / `TDC2` / `TDC3` | Entradas del índice (TOC) | — | Solo en `w:sdt/w:sdtContent`, nunca como hijos directos de `w:body` |

- Los estilos `Ttulo1/2/3` y `Ttulodendice` llevan `<w:outlineLvl>`. No añadirlo a `paragraph`.
- **`Ttulo1` en MAYÚSCULAS**: el estilo no tiene `w:caps`; aplicar `.upper()` en Python sobre todos los `w:t` del párrafo al mapear headings a `Ttulo1`.

**Espaciado estándar**:
- `Ttulo1`: `<w:spacing w:before="240" w:after="240"/>`
- `Ttulo2` / `Ttulo3`: `<w:spacing w:before="240" w:after="60"/>`
- `paragraph`: `<w:spacing w:before="100" w:after="100"/>` — **sin** `beforeAutospacing` ni `afterAutospacing` (añaden hasta 12pt extra tras headings creando una caja vacía visible).

### 2.2 Estilo de tabla: `TablaSEAT2`

- Toda tabla usa `<w:tblStyle w:val="TablaSEAT2"/>`.
- Ancho 100 %: `<w:tblW w:w="5000" w:type="pct"/>` en `<w:tblPr>`. Si la tabla clonada tiene `w:type="dxa"`, reemplazar por `w:type="pct" w:w="5000"`.
- Fila de cabecera: incluir `<w:cnfStyle w:val="100000000000" w:firstRow="1" .../>` en `<w:trPr>`.
- Filas de cuerpo: no añadir `w:shd` ni `w:tcBorders` explícitos — los gestiona el estilo.
- Al insertar tabla nueva: clonar `<w:tblPr>` completo de una tabla existente del documento.
- Al copiar tablas del original: **eliminar** `w:tblBorders`, `w:shd`, `w:tcBorders` explícitos.

---

## 3. Fuentes: Calibri (Cuerpo)

La especificación correcta usa referencias de tema, **no fuentes nombradas**:

```xml
<w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia"
          w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/>
```

**Obligatorio tras cualquier edición** (la implementación completa está en `Agente_actualizacion_doc_SEAT`):

1. Aplicar `set_calibri_cuerpo()` a **todos** los `w:rFonts` de `word/document.xml` **y** `word/styles.xml`.
2. Cubrir los estilos: `docDefaults`, `Normal`, `paragraph`, `Prrafodelista`, `NormalNegrita`.
3. Aplicar también sobre `word/numbering.xml` si se copiaron `abstractNum` del original.
4. **Excepciones**: conservar `Wingdings`, `Symbol` y sus variantes.
5. Safety net tras serializar: eliminar con regex `SeatMetaNormal`, convertir `cstheme="minorHAnsi"` → `cstheme="minorBidi"`, eliminar `<w:rFonts/>` vacíos.
6. **0 fuentes nombradas** permitidas en el resultado (`Arial`, `Times New Roman`, `Calibri` literal, etc.).

---

## 4. Imágenes de contenido

- **Imágenes en sección de contenido** (desde el primer `Ttulo1` en `document.xml`): borde negro `w="9525" cmpd="sng" algn="ctr"` + `<a:solidFill><a:srgbClr val="000000"/></a:solidFill>` + `<a:round/>`. Insertar `<a:noFill/>` **antes** de `<a:ln>` en `pic:spPr`. Orden: `xfrm` → `prstGeom` → `<a:noFill/>` → `<a:ln>`.
- **Portada** (antes del primer `Ttulo1`) y ficheros `word/footer*.xml` / `word/header*.xml`: **sin borde**.
- Cada imagen en su **propio párrafo** `paragraph`; nunca compartir párrafo con texto.
- Añadir un párrafo vacío `paragraph` después de cada párrafo de sola-imagen, excepto entre imágenes consecutivas.
- **Definición de párrafo vacío**: sin `w:t` con contenido no blanco **y** sin `w:drawing` — los párrafos con solo imágenes nunca se eliminan.

---

## 5. Track Changes (`w:ins`)

Cuando se requiere marcar contenido como revisión pendiente (obligatorio en LC; opcional en DT/DF):

- **2 `w:id` consecutivos por párrafo**: uno en `w:pPr/w:rPr` (marca que el párrafo es nuevo) y otro envolviendo el `w:r` con el texto (marca el contenido).
- `w:pStyle` debe ser **primer hijo** de `w:pPr`, antes de `w:numPr`.
- Atributos obligatorios en cada `w:ins`:
  - `w:id`: entero único. Calcular con `re.findall(r'<w:ins[^>]+w:id="(\d+)"', doc_str)` — **no** el patrón genérico `w:id="(\d+)"`, que captura también bookmarks y comentarios.
  - `w:author`: nombre real del usuario (de `graph_get_current_user` o `git config user.name`).
  - `w:date`: hora local del sistema (`YYYY-MM-DDTHH:MM:SSZ`).
  - `w16du:dateUtc`: misma fecha en UTC (restar offset horario local). **Obligatorio** para que Word 2021+ muestre autor y fecha en los globos de revisión.
- Declarar namespace `w16du` en el elemento raíz si no existe:
  ```python
  W16DU = 'http://schemas.microsoft.com/office/word/2023/wordml/word16du'
  if 'w16du' not in tree.nsmap:
      tree.attrib['{http://www.w3.org/2000/xmlns/}w16du'] = W16DU
  ```
- No reutilizar `w:id` ni `w:author` de revisiones existentes.
- **Activar Track Changes en `word/settings.xml`**: insertar **ambos** elementos para máxima compatibilidad. `<w:trackRevisions/>` es el que activa el botón "Control de cambios" en la UI de Word; `<w:trackChanges/>` es complementario. Solo con `<w:trackChanges/>` el botón puede no aparecer activo:
  ```python
  if '<w:trackRevisions' not in sett:
      sett = sett.replace('</w:settings>',
                          '<w:trackRevisions/><w:trackChanges/>\n</w:settings>', 1)
  ```

---

## 6. Modo seguro

- Siempre crear copia **`_preview`** (local) o **`_backup`** (SharePoint/tmp) antes de modificar.
- Validar semánticamente el resultado **antes** de reemplazar el original o subir a SharePoint.
- Nunca sobreescribir el original sin confirmación explícita del usuario.
- No reutilizar ficheros temporales de sesiones previas sin verificar que corresponden al proceso actual.

---

## 7. Reglas técnicas de edición DOCX

| Regla | Detalle |
|---|---|
| **lxml para operaciones estructurales** | Insertar/mover `w:p`, `w:tbl`, `w:tr` siempre con lxml. Regex solo para texto o extracción de `w:id`. Usar `if elem is not None:` — `bool(lxml_element)` devuelve `False` si el elemento no tiene hijos. |
| **ZIP sin modo `'a'`** | Leer el ZIP entero en `{n: z.read(n) for n in z.namelist()}`, modificar el dict y escribir un ZIP nuevo con `ZipFile(buf, 'w', ZIP_DEFLATED)`. El modo `'a'` genera entradas duplicadas que corrompen el `.docx`. |
| **Prefijos de exclusión del ZIP** | Excluir `('[trash]', '__MACOSX', '.DS_Store')`. **Nunca** usar `'['` solo como prefijo — también excluye `[Content_Types].xml`. |
| **Declaración XML** | Tras `etree.tostring()`, reemplazar comillas simples por dobles: `"<?xml version='1.0' encoding='UTF-8' standalone='yes'?>"` → `'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'`. |
| **Punto de inserción** | Usar `rfind()` para la **última** ocurrencia; nunca `find()` para anclas que pueden repetirse cientos de veces en el documento. |
| **`[Content_Types].xml`** | Verificar presencia y que declara `image/png` y `wordprocessingml.document.main`. Añadir extensiones no estándar (`.emf`, `.wmf`, `.svg`) si el ZIP las incluye. |
| **TOC en `w:sdt`** | Los párrafos `TDC1/2/3` viven en `w:sdt/w:sdtContent`, no como hijos directos de `w:body`. Usar XPath para localizarlos. |
| **TOC: no añadir `dirty`** | No añadir `w:dirty="true"` al `fldChar` del TOC ni `w:updateFields` en `settings.xml`. Ambos provocan que Word calcule la paginación de forma incorrecta (todos los números de página aparecen como `1`). |
| **`.rels` con lxml** | Parsear `word/_rels/document.xml.rels` con `etree.fromstring()`, nunca con regex — `[^/>]+` falla en URLs externas con `/` (`TargetMode="External"`). Construir `.rels` como string, no con `etree.SubElement`; verificar que `xmlns=` aparece exactamente 1 vez. |

---

## 8. Validación obligatoria antes de entregar

Antes de reemplazar el original o subir a SharePoint, verificar todos estos puntos:

1. `word/document.xml` es XML bien formado.
2. Contenido insertado dentro de `w:body` y antes de `w:sectPr`.
3. Texto visible del nuevo contenido en la sección correcta (buscar a partir de la posición del heading, no desde el inicio del documento).
4. Número de `Ttulo1`/`Ttulo2` no disminuye respecto al original.
5. Referencias `w:numId` apuntan a definiciones válidas en `word/numbering.xml`.
6. `w:id` nuevos únicos entre sí (usar patrón `<w:ins[^>]+w:id="(\d+)"`, no el genérico).
7. Partes ZIP obligatorias presentes: `word/document.xml`, `word/styles.xml`, `word/settings.xml`, `[Content_Types].xml`.
8. Todos los headings `Ttulo1/2/3` con `w:numPr` explícito (`numId=14`).
9. Imágenes de contenido con borde correcto; portada/header/footer sin borde.
10. `[Content_Types].xml` no vacío, con `image/png` y `wordprocessingml.document.main`.
11. Todos los `r:id` / `r:embed` de `word/document.xml` tienen entrada en `word/_rels/document.xml.rels` (0 huérfanos).
12. No hay `Id` duplicados en `word/_rels/document.xml.rels`.

---

## 9. Por tipo de documento

### 9.1 Log de Cambios (LC)

**Estructura**: sección principal `CAMBIOS` (`Ttulo1`). Cada ticket/versión como `Ttulo2`.

**Detección de sección existente**: buscar el `Ttulo2` por texto visible extraído exclusivamente de los `<w:t>` de párrafos con `<w:pStyle w:val="Ttulo2"/>`. **Nunca** buscar en el XML raw (produce falsos positivos con atributos como `w:rsidR`, `w14:paraId`). Si existe, reutilizar; si no, crear nuevo `Ttulo2`.

> Si el `Ttulo2` candidato está íntegramente dentro de elementos `w:del`, considerarlo como no existente y crear uno nuevo.

**Estructura del bloque insertado**:
```
CAMBIOS  ← Ttulo1 existente
  └── [Título ticket]           ← Ttulo2 (nuevo o reutilizado)
        ├── Frontend             ← Prrafodelista ilvl=0
        │   ├── ruta/fichero.js: ← Prrafodelista ilvl=1
        │   │   └── método – razón  ← Prrafodelista ilvl=2
```

- **Solo bloque `Frontend`**: todos los cambios (incluidos los de backend) van en ese bloque. No crear bloque `Backend`.
- **`numId` para `Prrafodelista`**: clonar del `w:numId` de los `Prrafodelista` existentes en `CAMBIOS`. Si no hay ninguno, usar `numId=16` (estándar plantilla LC) y verificar en `numbering.xml` que es `w:numFmt w:val="bullet"`, no `decimal`.
- **Inserción al final de `CAMBIOS`**: justo antes del siguiente `Ttulo1` o de `w:sectPr` si no hay ninguno.
- Párrafo vacío `w:p` entre el `Ttulo2` y el primer `Prrafodelista`, y otro al final del subapartado.
- **Track Changes obligatorio**: todo contenido nuevo con `w:ins`.

**Formato de texto por nivel**:
- Nivel 0: solo la palabra `Frontend`, sin puntuación.
- Nivel 1: ruta relativa del fichero seguida de `:`. Ejemplo: `controller/MyController.controller.js:`
- Nivel 2: `` `nombreMétodo` `` + ` – descripción única` que consolida todos los cambios del método. Un método = una línea. Orden igual al del diff.

**Migración LC — reglas adicionales**:
- Ítems del original: `ilvl=0` para cabeceras de bloque, `ilvl=1` para sub-ítems. Ambos usan `numId=16`.
- `ListParagraph` sin `numPr` (continuaciones con `–`) → `Prrafodelista` también sin `numPr`.
- No copiar `numPr` de párrafos-lista al convertirlos a `Ttulo2`.
- `numId=46` (familia Reccerticfcap): remapear siempre a `numId=16`.
- Línea vacía entre subsecciones de `CAMBIOS`: insertar párrafo vacío `paragraph` antes de cada `Ttulo2`, **excepto el primero**.

### 9.2 Documento Técnico (DT)

- Mapear secciones del índice original a `Ttulo1`/`Ttulo2`/`Ttulo3` según nivel.
- Control de versiones → tabla `TablaSEAT2` en sección equivalente de la plantilla.
- Diagramas, tablas técnicas → `paragraph` o `TablaSEAT2` según naturaleza.
- Sección de introducción → primera sección de contenido tras el índice.
- Mantener intactas las decisiones de diseño y restricciones técnicas.
- **METRICS pre-flight**: la plantilla DT puede consolidar en 1 tabla elementos que el original tenía en 2 (p. ej. tabla de portada + tabla de control de versiones). Ajustar `METRICS['tables']` restando la diferencia antes de validar. Igualmente, si existen `Heading2` vacíos (sin texto, `numId=0`) que el filtro elimina, restar ese número de `METRICS['ttulo2']`.

### 9.3 Documento Funcional (DF)

- Mapear secciones del índice original a `Ttulo1`/`Ttulo2`/`Ttulo3` según nivel.
- Control de versiones → tabla `TablaSEAT2`.
- Casos de uso, flujos y reglas de negocio → `paragraph` o `Prrafodelista`.
- Tablas funcionales (campos, validaciones, permisos) → `TablaSEAT2`.
- Mantener intactas las reglas de negocio y requisitos.

---

## 10. Reglas adicionales para migración a plantilla SEAT

Aplican cuando se migra un documento existente al nuevo formato (prompt `migrar_documento_seat`).

### Documento raíz y rIds
- Partir **siempre** de `dict(tmpl_files)` (plantilla como base); nunca del original.
- La plantilla reserva `rId1`–`rId15`. Los rIds del original que colisionen con `rId11`–`rId15` deben remapearse antes de insertar contenido: `rId11`→`rId52`, `rId12`→`rId53`, `rId13`→`rId54`, `rId14`→`rId55`, `rId15`→`rId56`.
- Parsear `.rels` con lxml; la regex `[^/>]+` falla con URLs externas (`TargetMode="External"` con `/`).

### `sectPr` de la plantilla
- El `<w:sectPr>` siempre del template, nunca del original. Debe ser el **último hijo** de `w:body`.
- Mantener `rId12` → `header1.xml` y `rId13` → `footer1.xml` intactos. Nunca modificar el `sectPr`.

### Colisión de media
- Ficheros de media del original con el mismo nombre que los de la plantilla → renombrar y actualizar los `r:embed` correspondientes.

### `word/numbering.xml`
- Todos los `w:abstractNum` deben aparecer **antes** de los `w:num`. Word ignora silenciosamente los `abstractNum` colocados después, haciendo que las listas no muestren viñeta.
- Al copiar `abstractNum` del original: usar `insert()` en la posición correcta (antes del primer `w:num`), nunca `append()`.

### Portada — segunda línea del título
- Usar el `w:rPr` del run de portada de la **plantilla** (no del original).
- **Eliminar siempre** `w:color` explícito del `w:rPr` copiado (puede contener rojo `#CC0000` residual).
- Texto: `SEAT – [NOMBRE DE LA APLICACIÓN]` (guion largo `–`, nombre en MAYÚSCULAS).

### Párrafo de introducción
- Nombre de la aplicación con capitalización normal en el cuerpo del párrafo, no en MAYÚSCULAS completas.

### Párrafos vacíos en el documento migrado
- **Eliminar** los vacíos inmediatamente después de un heading (`Ttulo1/2/3`).
- **Colapsar** secuencias de 2+ vacíos consecutivos a exactamente 1.
- **Conservar** un único vacío entre dos párrafos de cuerpo (`paragraph`/`Prrafodelista`) cuando el original lo tenía.
- Definición de vacío: sin `w:t` con contenido no blanco **y** sin `w:drawing`.

### Track Changes del documento original (migración)
- Comprobar si el original tiene `<w:trackRevisions/>` en `word/settings.xml` o elementos `w:ins`/`w:del` en `word/document.xml`.
- Si tiene revisiones activas o pendientes: copiar `<w:trackRevisions/>` al documento migrado y preservar todos los `w:ins`/`w:del` existentes.
- Hiperlinks del original con `r:id` que colisionen con `rId12`/`rId13`: añadir nuevas relaciones `hyperlink` con `TargetMode="External"` usando rIds nuevos y actualizar los `<w:hyperlink r:id="...">` afectados.
