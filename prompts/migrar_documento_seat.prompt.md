---
name: migrar_documento_seat
description: "Migra un documento SEAT existente (Log de Cambios, DT o DF) al nuevo formato corporativo partiendo de la plantilla oficial correspondiente. Preserva el historial de versiones, los cambios aceptados y pendientes, y el índice del documento original."
agent: Agente_actualizacion_doc_SEAT
argument-hint: "Escribe 'iniciar' para ver la plantilla de parámetros"
---

## Instrucciones de comportamiento

Al recibir cualquier mensaje de inicio (por ejemplo `iniciar`), muestra la plantilla de parámetros completa de una sola vez y espera a que el usuario la devuelva rellena.

Una vez recibida la plantilla rellena, ejecuta directamente sin hacer más preguntas, salvo las excepciones indicadas más abajo.

**Excepciones que sí requieren una pregunta adicional tras recibir la plantilla:**
1. Si algún campo obligatorio (`*`) viene vacío o con el texto de ejemplo sin modificar, solicitar únicamente ese campo.
2. Si el tipo de documento no coincide con ninguno de los tres tipos soportados (LC, DT, DF).
3. Si no se puede determinar la versión del documento original a partir del contenido proporcionado.

Trabaja siempre en **modo seguro**:
- No sobrescribas un fichero existente con el mismo nombre sin avisar.
- Genera primero una copia con sufijo `_preview` en la misma carpeta de destino.
- Valida la copia antes de proponer renombrarla al nombre definitivo.
- No reutilices ficheros temporales de ejecuciones anteriores sin verificar que corresponden al proceso actual.

---

## Plantilla de parámetros

Cuando el usuario active el prompt, muestra exactamente este bloque:

---

Lee los campos a continuación, después **copia el bloque al final y devuélvelo relleno en un solo mensaje**. Los marcados con `*` son obligatorios. Deja en blanco los opcionales que no apliquen.

---

**Tipo de documento** `*`  
Indica qué tipo de documento se va a migrar:  
· `LC` — **Log de Cambios** — plantilla: `SEAT - LC PLANTILLA v1.0.docx`  
· `DT` — **Documento Técnico** — plantilla: `SEAT - DT PLANTILLA v1.0.docx`  
· `DF` — **Documento Funcional** — plantilla: `SEAT - DF PLANTILLA v1.0.docx`

---

**Nombre de la aplicación** `*`  
Nombre de la aplicación o proyecto tal como debe aparecer en el título del documento.  
Se escribirá **siempre en mayúsculas** tanto en el nombre del fichero de salida como en la portada.  
Se usará para construir el nombre del fichero de salida siguiendo el formato:  
`SEAT - [TIPO] [NOMBRE DE LA APLICACIÓN] v[versión].docx`  
_Ejemplo: `PROCEDIMIENTOS`, `HR LAUNCHPAD`, `JOB POSITION`_

---

**Versión del documento original** `*`  
Número de versión del documento que se está migrando, tal como aparece en el fichero original.  
Se mantendrá en el nombre del nuevo fichero.  
_Ejemplo: `1.6`, `2.0`, `1.3`_

---

**Tabla de Gestión de versiones / Control de cambios** `*`  
Pega aquí el contenido completo de la tabla de control de versiones del documento original.  
Incluye todas las filas: versión, fecha, autor y descripción del cambio.  
Esta tabla se trasladará íntegra al nuevo documento dentro de la sección correspondiente.

_Formato sugerido (una fila por línea, columnas separadas por `|`):_  
```
Versión | Fecha      | Autor          | Descripción
1.0     | 01/01/2024 | Juan García    | Versión inicial
1.1     | 15/03/2024 | Ana López      | Corrección de sección 2.3
```

---

**Comentarios de versiones** _(opcional)_  
Pega aquí el contenido de la sección de comentarios o notas de versión del documento original, si existe.  
Se trasladará al nuevo documento en la sección equivalente.

---

**Tabla de contenido / Índice del documento original** `*`  
Pega aquí la tabla de contenido del documento original (secciones y subsecciones).  
Se usará como guía para replicar la estructura de secciones en el nuevo documento.

_Formato sugerido (un nivel por línea con indentación):_  
```
1. Introducción
2. Alcance
   2.1 Descripción
   2.2 Restricciones
3. Cambios
```

---

**Contenido del documento original** `*`  
Pega aquí el contenido de las secciones del documento original que deben trasladarse al nuevo formato.  
Incluye el texto de todos los apartados relevantes manteniendo su estructura jerárquica.  
No es necesario incluir de nuevo la tabla de versiones ni el índice (ya se capturaron arriba).

---

📋 **Copia este bloque, rellénalo y responde:**

```
Tipo de documento *            : 
Nombre de la aplicación *      : 
Versión del documento original *: 
Tabla de Gestión de versiones * : 
Comentarios de versiones        : 
Tabla de contenido *            : 
Contenido del documento *       : 
```

---

## Procedimiento de migración

### 1 — Localizar la plantilla
Buscar en la raíz del workspace el fichero de plantilla correspondiente al tipo indicado:
- `LC` → `SEAT - LC PLANTILLA v1.0.docx`
- `DT` → `SEAT - DT PLANTILLA v1.0.docx`
- `DF` → `SEAT - DF PLANTILLA v1.0.docx`

Si no se encuentra la plantilla, reportar el error y detener.

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

La versión se extrae del campo **Versión del documento original** proporcionado por el usuario.

### 3 — Crear la copia de trabajo
Crear una copia de la plantilla con sufijo `_preview` en la raíz del workspace:
```
SEAT - [TIPO] [NOMBRE DE LA APLICACIÓN] v[versión]_preview.docx
```
**Nunca** modificar la plantilla original directamente.

### 4 — Transferir el contenido al nuevo documento
Aplicar las instrucciones específicas según el tipo de documento (sección siguiente) y las instrucciones comunes (sección posterior).

### 5 — Validar el resultado
Verificar que:
- El fichero `_preview` es XML bien formado.
- La tabla de Gestión de versiones contiene todas las filas del original.
- Las secciones del índice original están presentes en el nuevo documento.
- El nombre del fichero de salida sigue el patrón correcto.
- Los estilos usados pertenecen al sistema SEAT (`Ttulo1`, `Ttulo2`, `paragraph`, `TablaSEAT2`, etc.).
- Los estilos `docDefaults`, `Normal`, `paragraph`, `Prrafodelista` y `NormalNegrita` en `styles.xml` usan `w:asciiTheme="minorHAnsi"` (Calibri Cuerpo). Si no, corregirlos con `set_calibri_cuerpo()` antes de guardar.
- El estilo `paragraph` en `styles.xml` tiene `<w:contextualSpacing/>` en su `w:pPr`. Si no, añadirlo para evitar espaciado doble entre párrafos consecutivos del mismo estilo.
- Cada `Ttulo2` de la sección CAMBIOS (excepto el primero) está precedido por un párrafo vacío de estilo `paragraph`.
- Ningún `Ttulo1`, `Ttulo2` ni `Ttulo3` está seguido inmediatamente por un párrafo vacío (el párrafo que sigue al heading debe ser contenido real o un `Prrafodelista`).
- Ningún `Ttulo2` tiene `w:numPr` ni `w:ind` en su `w:pPr` a nivel de párrafo que sobreescriba la definición del estilo (si aparecen, eliminarlos).
- Ningún `numId` referenciado en los párrafos copiados apunta a un `numId` que no exista en el `word/numbering.xml` de la plantilla. Si alguno falta, remapear al `numId` de la plantilla con la misma definición de `fmt` y `lvlText`.
- No hay más de 1 párrafo vacío consecutivo antes de ningún `Ttulo2` en la sección CAMBIOS.
- No hay párrafos vacíos (`paragraph` o `Prrafodelista`) entre dos `Prrafodelista` no vacíos consecutivos.

### 6 — Informar y pedir confirmación
- Comunicar la ruta exacta de la copia `_preview`.
- Confirmar que la plantilla original permanece intacta.
- Preguntar si el usuario desea renombrar la copia al nombre definitivo.
- Ofrecer eliminar los ficheros temporales tras la confirmación.

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

### Documento Funcional (DF)

- Respetar la estructura de secciones del índice original, mapeando cada nivel a `Ttulo1` / `Ttulo2` / `Ttulo3` según corresponda.
- El apartado de **control de versiones** del DF se traslada a la sección equivalente de la plantilla usando `TablaSEAT2`.
- Los casos de uso, flujos de usuario y reglas de negocio se trasladan como párrafos `paragraph` o listas `Prrafodelista` manteniendo su redacción original.
- Las tablas de datos funcionales (campos, validaciones, permisos, etc.) se recrean con el estilo `TablaSEAT2`.
- Mantener intactas las reglas de negocio, restricciones y requisitos documentados en el original.

---

## Instrucciones comunes (todos los tipos)

### Preservación del historial de versiones
- La tabla de Gestión de versiones del documento original se traslada **íntegra** al nuevo documento: no se elimina ninguna fila, no se modifica ningún dato existente.
- Las versiones ya aceptadas y cerradas se marcan sin Track Changes (son parte del historial consolidado).
- Si el documento original tenía cambios pendientes de aceptar (Track Changes activo), estos se identifican en el contenido proporcionado por el usuario y se mantienen como Track Changes en el nuevo documento usando el sistema `w:ins` / `w:del` del agente.

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
- Al actualizar esta línea **no se elimina el párrafo completo**; se conserva íntegramente el `w:pPr` del template y el `w:rPr` del primer run original. Solo se limpian los `w:r` existentes y se inserta uno nuevo con el `w:rPr` preservado y el texto `SEAT – [NOMBRE]`.

### Listas en CAMBIOS
- Los ítems de lista del documento original tienen **dos niveles**: `ilvl=0` para cabeceras de bloque (p.ej. `Backend`, `SAP Build App`) y `ilvl=1` para los sub-ítems (ficheros/rutas). Ambos usan `numId=16` que ya existe en la plantilla con la misma estructura de viñetas.
- Los elementos `ListParagraph` del original **sin `numPr`** (líneas de descripción/continuación que empiezan por `–` o `-`) se trasladan como `Prrafodelista` también sin `numPr`, manteniendo el sangrado visual pero sin viñeta.
- **⚠️ Remapeo de `numId` inexistentes en la plantilla**: tras copiar los párrafos del original, verificar que todos los `numId` referenciados en los `w:numPr` existen en el `word/numbering.xml` de la plantilla. Si algún `numId` del original no existe en la plantilla, puede provocar que Word renderice las listas como listas numeradas en lugar de viñetas. Para cada `numId` huérfano, localizar en el `numbering.xml` de la plantilla un `abstractNum` con la misma definición de formato (`fmt=bullet`/`fmt=decimal`, `lvlText`, niveles) y remapar todos los `w:numId[@w:val='X']` de los párrafos copiados al `numId` equivalente de la plantilla. Ejemplo: si el original usa `numId=46` (bullet) y la plantilla no lo tiene pero sí tiene `numId=16` con la misma definición, hacer `numId=46 → numId=16` en todo el document.xml del resultado.
- **⚠️ `numId=46` recurrente en documentos de la familia Reccerticfcap**: los documentos que comparten la plantilla original `Reccerticfcap` (Payslip, Certificado Retenciones, NEF…) utilizan habitualmente `numId=46` para los párrafos de estilo `''` que se comportan como lista. Este `numId=46` **no existe** en la plantilla SEAT LC, por lo que siempre debe remapearse a `numId=16`. Incluir este remapeo como paso estándar de post-procesado al migrar cualquier documento de esta familia: iterar todos los `w:numId[@w:val='46']` del `document.xml` resultante y cambiarlos a `'16'`.
- **No arrastrar `numPr` del original a párrafos `Ttulo2`**: el estilo `Ttulo2` de la plantilla SEAT ya tiene su propio `numPr` (`numId=14`, `ilvl=1`, formato `%1.%2`) que genera la numeración `2.1`, `2.2`, etc. Si el párrafo del original que se convierte a `Ttulo2` tenía un `numPr` en su `w:pPr` (por ejemplo `numId=16` de lista de viñetas), **no copiarlo**: omitir ese `numPr` al establecer el estilo `Ttulo2`. Igualmente, no copiar ningún `w:ind` de párrafos-lista que se conviertan a `Ttulo2`, ya que el estilo define su propio sangrado.
- Los párrafos de cuerpo con estilo vacío (`''`) en el original se mapean a `paragraph`.
- La estrategia correcta es copiar directamente los elementos del original con `copy.deepcopy`, cambiando solo el `w:pStyle` (no los `w:rPr` de los runs, para que las fuentes del template tomen efecto).

### Estilos y formato
- Usar **exclusivamente** los estilos del sistema SEAT definidos en el agente: `Ttulo1`, `Ttulo2`, `Ttulo3`, `paragraph`, `NormalNegrita`, `Prrafodelista`, `TablaSEAT2`, `Ttulodendice`.
- No usar estilos estándar de Word (`Heading1`, `Normal`, `ListParagraph`, etc.).
- El espaciado entre secciones debe respetar los valores estándar del sistema SEAT.
- **Calibri (Cuerpo) obligatorio en todo el contenido (excepto portada)**: tras construir el documento, corregir siempre `word/styles.xml` con la función `set_calibri_cuerpo()` sobre los estilos `docDefaults`, `Normal`, `paragraph`, `Prrafodelista` y `NormalNegrita`. Esto garantiza que el cuerpo del documento usa `minorHAnsi` (Calibri Cuerpo) y no Arial ni Times New Roman heredados de plantillas anteriores.
- **Sin espaciado doble entre párrafos consecutivos**: al corregir el estilo `paragraph` en `styles.xml`, añadir `<w:contextualSpacing/>` dentro de su `w:pPr`. Esto suprime el espacio automático (`w:afterAutospacing`) cuando dos párrafos consecutivos usan el mismo estilo, evitando que aparezca una línea en blanco visual entre ellos.
- **Línea vacía entre subsecciones en CAMBIOS**: insertar un párrafo vacío de estilo `paragraph` inmediatamente antes de cada `Ttulo2` dentro de la sección CAMBIOS, **excepto el primero**. El primer `Ttulo2` sigue directamente al `Ttulo1` sin párrafo vacío intermedio. Ejemplo de estructura correcta:
  ```
  Ttulo1: CAMBIOS
  Ttulo2: 2.1 Primer cambio       ← sin línea vacía antes
  ...contenido...
  [párrafo vacío]
  Ttulo2: 2.2 Segundo cambio      ← línea vacía antes
  ...contenido...
  ```
- **Sin párrafo vacío inmediatamente después de un heading**: nunca insertar un párrafo vacío entre un `Ttulo1`, `Ttulo2` o `Ttulo3` y su propio contenido. El espaciado visual entre secciones proviene del párrafo vacío que precede al siguiente heading, no del que sigue al actual. Si al copiar párrafos del original quedan párrafos vacíos (estilo `paragraph`, `''` o similar) justo tras un heading, eliminarlos.
- **⚠️ Normalización de vacíos antes de `Ttulo2`**: el documento original puede contener uno o varios párrafos vacíos antes de cada heading de nivel 2. Al combinarlos con el párrafo separador que el script de migración inserta, el resultado puede ser 2, 3 o más líneas vacías consecutivas antes de cada `Ttulo2`. Tras copiar el contenido, aplicar una pasada de normalización que reduzca a exactamente 1 cualquier secuencia de párrafos vacíos consecutivos que preceda a un `Ttulo2`. Algoritmo: para cada `Ttulo2`, contar los párrafos vacíos inmediatamente anteriores; si hay más de 1, eliminar todos menos el más cercano al `Ttulo2`.
- **⚠️ Vacíos entre sub-secciones internas de un cambio (Backend/Frontend/DB)**: el documento original puede incluir párrafos vacíos (`paragraph` o `Prrafodelista` sin texto) entre los bloques de lista de un mismo apartado BTPHR/IR (p.ej., entre la lista de Backend y la lista de Frontend). Tras copiar el contenido, eliminar todos los párrafos vacíos que queden rodeados de `Prrafodelista` no vacíos a ambos lados. Regla: eliminar el párrafo si `estilo(previo_no_vacío) == Prrafodelista` **y** `estilo(siguiente_no_vacío) == Prrafodelista`. Aplicar en bucle hasta convergencia (puede requerir varias pasadas si hay vacíos consecutivos entre listas).

### Índice / Tabla de contenidos
- El campo de índice automático (TOC) de la plantilla se mantiene **exactamente tal cual**: no se elimina, no se reconstruye, no se añaden entradas, no se modifican los números de página y no se insertan campos `PAGEREF`.
- **No** añadir `w:dirty="1"` al `fldChar` del campo TOC ni `w:updateFields` en `settings.xml`: ambos mecanismos provocan que Word evalúe los campos antes de paginar y todos los números de página aparecen como `1`.
- Los números de página del índice quedarán desactualizados hasta que el usuario los regenere manualmente en Word. Esto es correcto y esperado.
