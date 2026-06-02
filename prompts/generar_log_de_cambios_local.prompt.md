---
name: generar_log_de_cambios_local
description: "Genera un log de cambios para un proyecto UI5, listando los cambios por fichero y, cuando aplique, por controlador, vista, fragmento o módulo, con una razón breve y concisa por cada modificación. Presenta una plantilla con todos los parámetros de una sola vez para que el usuario los rellene en un único mensaje."
argument-hint: "Escribe 'iniciar' para ver la plantilla de parámetros"
---

## Instrucciones de comportamiento

Al recibir cualquier mensaje de inicio (por ejemplo `iniciar`), detecta si el usuario ha indicado que quiere ejecutarlo **sin descripción** (por ejemplo: `iniciar sin descripción`, `sin descripción`, `modo corto`, `solo tabla`, `sin explicaciones` o cualquier expresión equivalente).

- **Con descripción** (por defecto): presenta la plantilla completa con el texto explicativo de cada campo tal como aparece a continuación.
- **Sin descripción**: presenta **únicamente el bloque de tabla** al final de la sección "Plantilla de parámetros" — sin los títulos de campo ni las explicaciones individuales — para que el usuario lo copie y rellene directamente.

En ambos casos, no hagas preguntas por separado: muestra el bloque correspondiente de una sola vez y espera a que el usuario lo devuelva relleno.

Una vez recibida la plantilla rellena, ejecuta el análisis directamente sin hacer más preguntas, salvo las dos excepciones indicadas más abajo.

**Excepciones que sí requieren una pregunta adicional tras recibir la plantilla:**
1. Si el destino es `.docx` y `git config user.name` devuelve un alias técnico (un único token sin espacios), preguntar el nombre completo del autor.
2. Si algún campo obligatorio (`*`) viene vacío o con el texto de ejemplo sin modificar, solicitar únicamente ese campo.

Cuando el destino sea `.docx`, trabaja siempre en **modo seguro**:
- no sobrescribas el fichero original en el primer intento;
- genera primero una copia de revisión;
- valida esa copia antes de proponer sustituir el original;
- no reutilices copias temporales de ejecuciones anteriores sin comprobar que corresponden al fichero origen actual.

---

## Plantilla de parámetros

Cuando el usuario active el prompt, muestra exactamente este bloque:

---

Lee los campos a continuación, después **copia el bloque al final y devuélvelo relleno en un solo mensaje**. Los marcados con `*` son obligatorios. Deja en blanco los opcionales que no apliquen.

---

**Proyecto** `*`  
Nombre de la carpeta raíz del proyecto dentro del workspace.  
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

**Destino** `*`  
Indica dónde quieres ver el resultado:  
· `1` — **Mostrar en el chat**: el log se genera dentro de un bloque de código markdown en esta misma conversación, listo para seleccionar y copiar íntegramente.  
· `2` — **Insertar en fichero**: el log se inserta dentro de un fichero del proyecto. Soporta `.docx` (Word con Track Changes), `.md` y `.txt`.

---

**Fichero destino** _(solo si Destino = 2)_  
Nombre del fichero donde insertar el log. Se buscará en este orden:  
1. Carpeta raíz del proyecto (mismo nivel que `webapp/`).  
2. Raíz del workspace (carpeta padre del proyecto).  
Si hay varias coincidencias, se listarán todas y se pedirá al usuario que confirme cuál usar.  
· Si es `.docx`: el contenido se inserta con marcas de revisión (Track Changes), dentro de la sección `CAMBIOS`.  
· Si es `.md` o `.txt`: el contenido se añade en la sección indicada con el mismo estilo de headings del resto del fichero.  
_Ejemplo: `CHANGES_LOG.docx`, `CHANGELOG.md`, `notas.txt`_

---

**Título de sección** _(solo si Destino = 2)_  
Título exacto del subapartado que se creará (o se reutilizará) dentro del fichero para insertar el log.  
Si ya existe una sección con ese título o con el mismo identificador de ticket, el contenido se añade dentro sin duplicarla.  
_Ejemplo: `BTPHR-1059 Corrección validación de firma`, `Sprint 14 — Semana 2`_

---

**Autor** _(solo si Destino = 2 con fichero `.docx` y tu nombre en git es un alias)_  
Si tu nombre en git es un alias técnico (un único token sin espacios, como `jsmith` o `dev01`), escribe aquí tu nombre completo. Se usará como autor en las marcas de revisión del documento.  
Si tu nombre en git ya es legible (dos palabras o más), deja este campo en blanco.  
_Ejemplo: `Juan García López`_

---

📋 **Copia este bloque, rellénalo y responde:**

```
Proyecto *         : 
Origen *           : 
Rama base          : 
Destino *          : 
Fichero destino    : 
Título de sección  : 
Autor              : 
```

---

## Directrices de inserción en `.docx` (siempre que el destino sea Word)

### Ubicación dentro del documento
El contenido **siempre** se inserta dentro de la sección `CAMBIOS` (`Heading1`) como un nuevo subapartado. Nunca fuera de ella.

El nuevo subapartado se inserta al **final** de la sección `CAMBIOS`: justo antes del siguiente `Heading1` que la suceda o, si no hay ninguno, justo antes de `w:sectPr`.

Antes de insertar un nuevo `Heading2`, comprobar en este orden:
- coincidencia exacta del título completo;
- coincidencia por identificador de ticket (por ejemplo `BTPHR-1059`);
- coincidencia normalizada ignorando mayúsculas/minúsculas, dobles espacios y signos menores.

> **Crítico — cómo buscar**: la búsqueda del identificador de ticket **debe hacerse exclusivamente sobre el texto visible extraído de los `<w:t>` de párrafos con `<w:pStyle w:val="Heading2"/>`**, nunca sobre el XML en bruto del documento. Buscar en el XML completo produce falsas coincidencias con atributos como `w14:paraId`, `w:rsidR`, etc., que pueden contener los mismos dígitos que el número de ticket.

Ejemplo correcto en Python:
```python
for m in re.finditer(r'<w:pStyle w:val="Heading2"/>', content):
    p_start = content.rfind('<w:p ', 0, m.start())
    p_end   = content.find('</w:p>', p_start) + 6
    block   = content[p_start:p_end]
    text    = ''.join(re.findall(r'<w:t[^>]*>([^<]+)</w:t>', block))
    if 'BTPHR-795' in text:  # coincidencia sobre texto visible, no XML raw
        # sección encontrada → reutilizar
```

Si ya existe una coincidencia por ticket, no crear un nuevo `Heading2`: reutilizar la sección existente.

> **Importante**: si el `Heading2` candidato existe pero su texto está íntegramente dentro de elementos `w:del` (es decir, es una eliminación pendiente de aceptar), considerarlo como **no existente** y crear un nuevo `Heading2` con el título completo.

### Estructura del nuevo subapartado
```
CAMBIOS  ← Heading1 existente, no se toca
  └── [Título del ticket]           ← Heading2  (nuevo)
        ├── Frontend                ← ListParagraph ilvl=0
        │   ├── ruta/fichero.js:    ← ListParagraph ilvl=1
        │   │   └── método – razón  ← ListParagraph ilvl=2
        │   └── ruta/otro.xml:      ← ListParagraph ilvl=1
        │       └── descripción     ← ListParagraph ilvl=2
```

### Estilos y atributos XML exactos a usar
| Nivel | Estilo Word (`w:pStyle`) | `w:ilvl` | `w:numId` |
|---|---|---|---|
| Título del subapartado | `Heading2` | — | — |
| "Frontend" | `ListParagraph` | `0` | clonar del `w:numId` del `ListParagraph ilvl=0` más próximo en `CAMBIOS` |
| Ruta de fichero | `ListParagraph` | `1` | mismo `w:numId` que el nivel 0 |
| Descripción del cambio | `ListParagraph` | `2` | mismo `w:numId` que el nivel 0 |

**Fallback cuando no hay entradas previas en CAMBIOS**: si no existe ningún `ListParagraph` en la sección `CAMBIOS`, usar `numId=1` como punto de partida e inspeccionar `word/numbering.xml` del propio documento para confirmar qué `numId` corresponde a una lista con tres niveles de sangría. Usar ese valor en todos los párrafos del nuevo subapartado.

### Formato del texto en cada nivel
- **Título (`Heading2`)**: texto completo del título de la incidencia/ticket tal como lo proporcionó el usuario.
- **Nivel 0** (`Frontend`): solo esa palabra, sin puntuación.
- **Nivel 1** (fichero): ruta relativa al proyecto + `:` al final. Ejemplo: `controller/MyController.controller.js:`
- **Nivel 2** (cambio): formato `nombreMétodo – descripción breve del cambio`. Si no hay método identificable, descripción directa del cambio.

### Orden de aparición de los bloques
1. Solo `Frontend`: todos los cambios detectados se insertan en este bloque.
2. No crear bloque `Backend` en ningún caso.

### Párrafo vacío entre subapartados
Insertar un párrafo vacío (`w:p` sin estilo ni contenido) entre el `Heading2` y el primer `ListParagraph`, y otro al final del subapartado, replicando el patrón del documento existente.

### Modo seguro de escritura — obligatorio
- No sobrescribir el fichero original en la primera escritura.
- Crear primero una copia de salida con sufijo `_preview`, `_con_cambios` o equivalente **en la misma carpeta donde está el original**.
- Al finalizar, informar la ruta de la copia y pedir al usuario confirmación explícita para reemplazar (o no) el original.
- No reutilizar backups o temporales de sesiones previas como base de una nueva modificación sin verificar que su hash coincide con el fichero origen actual.

### Control de versiones (Track Changes) — obligatorio
Todo el contenido insertado **siempre** debe ir marcado como revisión pendiente, independientemente de si el documento ya tiene revisiones activas o no:
- Cada `ListParagraph` nuevo requiere **dos `w:ins` separados** (no uno envolviendo todo el `w:p`):
  1. Un `w:ins` vacío dentro de `w:pPr/w:rPr` — marca que el párrafo en sí es nuevo.
  2. Un `w:ins` envolviendo solo el `w:r` con el texto — marca el contenido del run.
- **Obligatorio**: cada `w:p` nuevo debe incluir `<w:pStyle w:val="ListParagraph"/>` como primer hijo de `w:pPr`, antes de `w:numPr`. Omitirlo hace que Word renderice el párrafo con el estilo Normal en lugar de `ListParagraph`, produciendo una fuente distinta a la del resto del documento.
- Por tanto cada párrafo consume **2 `w:id` consecutivos**. Al calcular el `w:id` de partida, sumar 2 por cada párrafo insertado, no 1.
- Atributos requeridos en cada `w:ins`:
  - `w:id`: entero único incremental. **Calcular el `w:id` máximo leyendo directamente el ZIP original en disco** (`zipfile.ZipFile(original).read('word/document.xml')`), nunca sobre una copia desempacada que pudiera provenir de una sesión previa. Sumar 1 a partir de ese máximo; como cada párrafo genera 2 `w:ins`, el contador avanza de 2 en 2.
  - `w:author`: valor obtenido de `git config user.name` (o el nombre introducido por el usuario en el Paso 3c).
  - `w:date`: fecha y hora local del sistema en formato `YYYY-MM-DDTHH:MM:SSZ`.
  - `w16du:dateUtc`: misma fecha en UTC puro (restar el offset horario local a `w:date`). **Obligatorio** para que Word 2021+ muestre el autor y la fecha en los globos de revisión. Sin este atributo, el texto aparece subrayado en color pero sin nombre ni hora visible.
- No reutilizar el `w:author` ni el `w:id` de revisiones existentes en el documento.

Ejemplo de estructura XML para un párrafo de nivel 0 (IDs 119 y 120):
```xml
<w:p>
  <w:pPr>
    <w:pStyle w:val="ListParagraph"/>
    <w:numPr><w:ilvl w:val="0"/><w:numId w:val="[numId del documento]"/></w:numPr>
    <w:rPr>
      <w:ins w:id="119" w:author="Nombre Apellido" w:date="2026-03-24T10:00:00Z" w16du:dateUtc="2026-03-24T09:00:00Z"/>
    </w:rPr>
  </w:pPr>
  <w:ins w:id="120" w:author="Nombre Apellido" w:date="2026-03-24T10:00:00Z" w16du:dateUtc="2026-03-24T09:00:00Z">
    <w:r><w:t>Frontend</w:t></w:r>
  </w:ins>
</w:p>
```

### Normalización de la declaración XML — obligatorio
Tras serializar `word/document.xml` con lxml (`tree.write()`), verificar que la declaración XML usa **comillas dobles**. lxml puede generarla con comillas simples, lo que algunos parsers de Word rechazan:

```python
xml_str = xml_bytes.decode('utf-8')
xml_str = xml_str.replace(
    "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    1
)
```

---

## Paso 3c — Autor de los cambios (solo si destino = `.docx`)

Ejecuta `git config user.name`. Si el resultado es un nombre completo legible (contiene al menos dos palabras), úsalo directamente sin preguntar. Si es un alias técnico (un solo token, sin espacios), pregunta:
> ¿Cuál es tu nombre completo? Lo usaré como autor en las marcas de revisión del documento.

---

## Ejecución

Una vez recogidos todos los parámetros, aplica siempre estos valores fijos:
- Desglose por fichero + método/vista cuando se detecte: **sí**
- Incluir ficheros eliminados/renombrados: **sí**
- Rutas: **relativas**

1. Obtén el diff con el comando adecuado según el origen elegido:
   - Sin commit: `git status` + `git diff HEAD`
   - Entre ramas: `git diff <rama-base>...HEAD --name-status` y luego `git diff <rama-base>...HEAD`
2. Analiza cada fichero modificado e infiere el elemento interno (controlador, vista, fragmento, modelo, utils) cuando sea posible.
3. Genera la salida según el destino:
   - **Chat**: presenta la cabecera como `##` fuera de cualquier bloque, seguida del log renderizado directamente como lista Markdown (sin bloque de código) con tres niveles de sangría:
     - Nivel 0 (`- `): bloque `Frontend`.
     - Nivel 1 (`  - `): ruta relativa del fichero seguida de `:`. Ejemplo: `webapp/utils/manageCAP.js:`
     - Nivel 2 (`    - `): `` `nombreMétodo` `` en backticks + ` – descripción única que consolida todos los cambios del método en una sola frase`. Si no hay método identificable, descripción directa sin backticks.
     - Un método = una única línea de nivel 2, independientemente de cuántos cambios tenga. Agrupar todos los cambios del mismo método en una sola descripción concisa. Mantener el mismo orden que devuelve el diff.
   - **Fichero `.docx`**: sigue el procedimiento de la skill `docx` (`.github/skills/docx/SKILL.md`) para editar el documento. Clona siempre los estilos de párrafo de las entradas Frontend existentes (niveles 0, 1, 2 de lista). No modificar nada fuera de la sección indicada. Buscar el original por nombre: primero en la carpeta raíz del proyecto, luego en la raíz del workspace. Crear la copia en la misma carpeta donde se encontró el original.
   - **Fichero `.md` / `.txt`**: añade el contenido en la sección indicada con el mismo estilo de headings del resto del fichero.

Para destino `.docx`, tras generar la copia validada, comunicar siempre:
- ruta exacta de la copia generada;
- que el original permanece intacto;
- pregunta final: si desea sustituir el original por la copia.

Una vez confirmada (o rechazada) la sustitución, proponer al usuario eliminar los ficheros temporales generados durante el proceso:
- directorio de desempaquetado (por ejemplo `/tmp/docx_unpack/`);
- scripts auxiliares creados en `/tmp/` (por ejemplo `/tmp/insert_frontend.py`).

Ejemplo de mensaje:
> ¿Quieres que elimine los ficheros temporales generados durante el proceso?
> - `/tmp/docx_unpack/`
> - `/tmp/insert_frontend.py` _(si se creó)_
>
> Si los elimino, no podrás recuperarlos. El documento final ya está guardado en su ubicación definitiva.

## Validación obligatoria para `.docx`

Antes de dar por bueno el resultado:
1. Validar que `word/document.xml` sigue siendo XML bien formado.
2. Validar que el bloque insertado está dentro de `CAMBIOS` y no fuera de esa sección.
3. Validar que el nuevo contenido queda antes de `w:sectPr` y dentro del flujo principal del documento.
4. Verificar que el texto visible del bloque insertado contiene el título del ticket y la entrada `Frontend` esperada. La búsqueda debe hacerse **a partir de la posición del `Heading2` del ticket** en el XML, no desde el inicio del documento — el documento puede contener otras ocurrencias anteriores de las mismas palabras que no corresponden al bloque recién insertado.
5. Verificar que el número de `Heading1` y `Heading2` no disminuye inesperadamente respecto al documento origen.
6. Verificar que los **`w:id` recién asignados** (aquellos ≥ `max_id_original + 1`) son únicos entre sí. No comparar contra los IDs del documento original: Word genera internamente IDs duplicados en su historial de revisiones y eso es esperado; verificar solo los nuevos evita falsos positivos en la validación.
7. Si falla cualquier validación, conservar el original y entregar solo una copia de diagnóstico.

## Índice (`TOC`) en `.docx`

- No insertar ni actualizar el índice salvo que el usuario lo pida explícitamente.
- Insertar un campo TOC no equivale a recalcular el índice final.
- No afirmar que el índice está actualizado si no se ha ejecutado una herramienta que refresque campos de Word/LibreOffice.

---

## Reglas

- No inventar cambios: basarse únicamente en el diff real.
- **Listar todos los ficheros modificados sin excepción**, independientemente de su tipo: `.js`, `.xml`, `.css`, `.properties` (i18n), imágenes, `.json`, `.yaml`, `.html`, etc.
- En destino `.docx`, crear **solo** el apartado `Frontend`: todos los cambios (incluidos los de backend) se documentan dentro de ese bloque.
- Priorizar claridad y brevedad en cada descripción.
- Agrupar por fichero y mantener orden estable (mismo orden que devuelve el diff).
- Si el destino es `.docx`, seguir el procedimiento de la skill `docx` (`.github/skills/docx/SKILL.md`). **Siempre** marcar cada párrafo nuevo con dos `w:ins` separados (uno en `w:pPr/w:rPr` y otro envolviendo `w:r`) con autor (`git config user.name`), `w:date` (hora local del sistema) y `w16du:dateUtc` (hora UTC, restando el offset local), independientemente de si el documento ya tiene Track Changes activos. Cada párrafo consume 2 `w:id` consecutivos. No reutilizar `w:id` ni `w:author` de revisiones existentes.
- No considerar exitosa una edición de `.docx` únicamente porque el XML haga parse: la validación semántica del contenido insertado es obligatoria.
