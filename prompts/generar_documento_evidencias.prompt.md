---
name: generar_documento_evidencias
description: "Genera un documento de evidencias/pruebas para un desarrollo en formato .docx. Soporta plantilla personalizada (opción 1) o formato predefinido (opción 2). Si no se detallan los pasos de prueba, los genera automáticamente a partir de la descripción funcional."
argument-hint: "Escribe 'iniciar' para ver la plantilla de parámetros"
---

## Instrucciones de comportamiento

Al recibir cualquier mensaje de inicio (por ejemplo `iniciar`), muestra la plantilla de parámetros completa de una sola vez y espera a que el usuario la devuelva rellena.

Una vez recibida la plantilla rellena, ejecuta directamente sin hacer más preguntas, salvo las excepciones indicadas más abajo.

**Excepciones que sí requieren una pregunta adicional tras recibir la plantilla:**
1. Si `git config user.name` devuelve un alias técnico (un único token sin espacios), preguntar el nombre completo del autor.
2. Si algún campo obligatorio (`*`) viene vacío o con el texto de ejemplo sin modificar, solicitar únicamente ese campo.

---

**1 — Fichero template:**
- **Opción 1** (plantilla personalizada): lee el fichero `.docx` indicado como plantilla base. Crea una copia con el contenido generado respetando los estilos, cabeceras y secciones del original. Marca todo el contenido insertado con Track Changes (mismo patrón que la sección "Control de versiones" de este prompt).
- **Opción 2** (formato predefinido): genera un fichero `.docx` nuevo desde cero con la estructura descrita en la sección "Formato predefinido" de este prompt. No aplica Track Changes en este caso al ser un documento creado íntegramente.

**2 — Pasos de prueba:**
- Si el usuario proporcionó los pasos, úsalos directamente.
- Si el campo está vacío o contiene `auto`, dedúcelos a partir de la descripción funcional. Genera pasos concretos, enumerados, con acción y resultado esperado para cada uno.

**3 — Nombre del fichero de salida:**
- Si el usuario indicó un nombre, úsalo.
- Si no, genera el nombre automáticamente a partir del título del cambio: slug en minúsculas con guiones, prefijado con `Evidencias_`. Ejemplo: `Evidencias_BTPHR-1059-correccion-validacion-firma.docx`.
- La ubicación del fichero de salida es la carpeta raíz del workspace, salvo que el usuario especifique otra.

**4 — Contenido del documento:**
- La descripción del cambio se redacta como un **resumen funcional** comprensible para el evaluador. No incluir desglose por capas técnicas (front/back, controlador, modelo, etc.).

Trabaja siempre en **modo seguro**:
- No sobrescribas un fichero existente con el mismo nombre sin avisar.
- Genera primero una copia con sufijo `_preview` en la misma carpeta de destino.
- Valida la copia antes de proponer sustituir (o renombrar) al nombre definitivo.
- No reutilices ficheros temporales de ejecuciones anteriores sin verificar que corresponden al proceso actual.

---

## Plantilla de parámetros

Cuando el usuario active el prompt, muestra exactamente este bloque:

---

Lee los campos a continuación, después **copia el bloque al final y devuélvelo relleno en un solo mensaje**. Los marcados con `*` son obligatorios. Deja en blanco los opcionales que no apliquen.

---

**Título del cambio** `*`  
Nombre descriptivo del desarrollo o corrección que se va a probar.  
_Ejemplo: `BTPHR-1059 — Corrección validación de firma en formulario de procedimientos`_

---

**Fichero template** `*`  
Indica si quieres usar una plantilla personalizada o el formato predefinido:  
· `1` — **Plantilla personalizada**: se usa un fichero `.docx` existente como base. Indica la ruta a continuación.  
· `2` — **Formato predefinido**: se utiliza el formato de evidencias estándar definido en este prompt.

_Ruta del fichero template (solo si seleccionas la opción 1):_  
_Ejemplo: `resources/templates/EvidenciasTemplate.docx`_

---

**Descripción funcional del cambio** `*`  
Explica qué se ha desarrollado o corregido desde la perspectiva del usuario. Resume el comportamiento anterior, el nuevo comportamiento y el alcance del cambio, sin entrar en detalle técnico de implementación.  
_Ejemplo: `Se corrige el comportamiento del campo de firma en el formulario de procedimientos. Anteriormente el campo no validaba el contenido antes de guardar. Ahora se valida que la firma tenga un valor correcto y se muestra un mensaje de error si no se cumple.`_

---

**Pasos de prueba** _(opcional — si no se indican, se generan automáticamente a partir de la descripción)_  
Lista los pasos que el evaluador debe seguir para verificar el desarrollo. Incluye acción y resultado esperado para cada paso.  
_Formato sugerido (uno por línea):_  
`1. Navegar a la pantalla de procedimientos`  
`2. Rellenar el campo de firma con un valor incorrecto y pulsar Guardar`  
`3. Verificar que el sistema muestra el mensaje de error correspondiente`  
`4. Rellenar el campo con un valor válido y pulsar Guardar`  
`5. Verificar que el sistema guarda correctamente y muestra la confirmación`

---

**Nombre del fichero de salida** _(opcional — si no se indica, se genera automáticamente a partir del título)_  
Nombre con el que se creará el fichero `.docx` en el workspace.  
_Ejemplo: `Evidencias_BTPHR-1059.docx`_

---

**Autor** _(opcional — solo si tu nombre en git es un alias técnico)_  
Si tu nombre en git (`git config user.name`) es un alias de un único token sin espacios (ej: `jsmith`, `dev01`), escribe aquí tu nombre completo. Se usará como autor en las marcas de revisión del documento cuando se use plantilla personalizada.  
Si tu nombre en git ya es legible (dos palabras o más), deja este campo en blanco.  
_Ejemplo: `Juan García López`_

---

📋 **Copia este bloque, rellénalo y responde:**

```
Título del cambio *            : 
Fichero template *  (1 / 2)   : 
Ruta del fichero template      : 
Descripción funcional *        : 
Pasos de prueba (vacío = auto) : 
Nombre del fichero de salida   : 
Autor                          : 
```

---

## Autor de las marcas de revisión (solo opción 1)

Ejecuta `git config user.name`. Si el resultado contiene al menos dos palabras, úsalo directamente. Si es un alias técnico (un único token), pregunta:
> ¿Cuál es tu nombre completo? Lo usaré como autor en las marcas de revisión del documento.

---

## Control de versiones (Track Changes) — solo opción 1

Cuando el contenido se inserte sobre una plantilla existente, todo el texto añadido debe marcarse como revisión pendiente:

- Cada párrafo nuevo requiere **dos `w:ins` separados**:
  1. Un `w:ins` vacío dentro de `w:pPr/w:rPr` — marca que el párrafo en sí es nuevo.
  2. Un `w:ins` envolviendo solo el `w:r` con el texto — marca el contenido del run.
- Atributos requeridos en cada `w:ins`:
  - `w:id`: entero único incremental. Calcular el `w:id` máximo leyendo el ZIP original (`zipfile.ZipFile(original).read('word/document.xml')`). Sumar 1 desde ese máximo; cada párrafo genera 2 `w:ins`, por lo que el contador avanza de 2 en 2.
  - `w:author`: valor de `git config user.name` (o el nombre introducido por el usuario).
  - `w:date`: fecha y hora local del sistema en formato `YYYY-MM-DDTHH:MM:SSZ`.
  - `w16du:dateUtc`: misma fecha en UTC (restar el offset horario local). **Obligatorio** para que Word muestre el autor y la fecha en los globos de revisión.
- No reutilizar el `w:author` ni el `w:id` de revisiones existentes en el documento.

### Normalización de la declaración XML — obligatorio (opción 1)

Tras serializar `word/document.xml` con lxml, verificar que la declaración usa comillas dobles:

```python
xml_str = xml_bytes.decode('utf-8')
xml_str = xml_str.replace(
    "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    1
)
```

---

## Validación obligatoria

Antes de dar por bueno el resultado:
1. Verificar que el fichero `.docx` generado se abre sin errores (XML bien formado).
2. Verificar que todas las secciones esperadas están presentes: descripción, pre-condiciones, pasos de prueba, observaciones y firmas.
3. Si se usó plantilla (opción 1): verificar que el número de secciones no disminuye respecto al original.
4. Para opción 1: verificar que los `w:id` recién asignados son únicos entre sí.
5. Si falla cualquier validación, conservar la plantilla original intacta y entregar solo la copia de diagnóstico.

Tras generar la copia validada, comunicar siempre:
- Ruta exacta del fichero generado (con sufijo `_preview`).
- Que el original (si se usó plantilla) permanece intacto.
- Pregunta final: si desea renombrar la copia al nombre definitivo.

Una vez confirmada (o rechazada) la operación, proponer eliminar los ficheros temporales del proceso:
> ¿Quieres que elimine los ficheros temporales generados?
> - `/tmp/docx_unpack/` _(si se creó)_
> - `/tmp/generar_evidencias.py` _(si se creó)_
>
> Si los elimino, no podrás recuperarlos. El documento final ya está guardado en su ubicación definitiva.

---

## Formato predefinido (usado cuando Fichero template = 2)

Cuando no se use plantilla personalizada, el fichero `.docx` generado tendrá las siguientes secciones. Los valores entre `{…}` se sustituyen con los datos reales.

| Sección | Contenido |
|---|---|
| **Título** | `Documento de Evidencias — {Título del cambio}` |
| **Cabecera** | Tabla con Fecha (fecha actual), Ticket/Referencia (extraído del título) y Versión 1.0 |
| **1 — Resumen del cambio** | Párrafo con la descripción funcional proporcionada por el usuario, sin desglose técnico |
| **2 — Pre-condiciones** | Lista de condiciones previas a la ejecución, generadas automáticamente a partir de la descripción |
| **3 — Pasos de prueba** | Tabla: Nº · Acción · Resultado esperado · Resultado obtenido · Estado (⬜ / ✅ / ❌ / ⏭) |
| **4 — Observaciones** | Párrafo vacío reservado para el evaluador |
| **5 — Firmas** | Tabla: Rol · Nombre · Fecha · Resultado — filas para Desarrollador y Evaluador |
