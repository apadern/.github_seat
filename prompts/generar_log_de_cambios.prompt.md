---
name: generar_log_de_cambios
description: "Genera un log de cambios para un proyecto UI5, listando los cambios por fichero y, cuando aplique, por controlador, vista, fragmento o módulo, con una razón breve y concisa por cada modificación. Realiza una entrevista interactiva preguntando un parámetro a la vez antes de ejecutar."
argument-hint: "Escribe 'iniciar' para comenzar la entrevista guiada"
---

## Instrucciones de comportamiento

Debes recopilar los parámetros necesarios haciendo **una sola pregunta por turno** en el chat. No hagas varias preguntas a la vez. Espera la respuesta antes de continuar. Sigue el orden exacto que se indica a continuación. Una vez tengas todos los parámetros, ejecuta el análisis sin preguntar más.

---

## Paso 1 — Proyecto

Pregunta:
> ¿Cuál es la ruta de la carpeta del proyecto UI5 a analizar?
> (Ejemplo: `procedurescfui5`, `hrconfigui5`, `proceduresdefinitioncfui5`)

---

## Paso 2 — Origen de los cambios

Pregunta:
> ¿De dónde obtengo los cambios?
> - `1` — Cambios sin commit (staged y unstaged del estado local)
> - `2` — Comparación entre ramas (cambios en la rama actual que no están en otra)

---

## Paso 2b — Ramas (solo si eligió `2`)

Pregunta:
> ¿Contra qué rama base comparo? (Ejemplo: `main`, `develop`, `prod`)
> La rama actual la detecto automáticamente con `git branch --show-current`.

---

## Paso 3 — Destino del resultado

Pregunta:
> ¿Dónde quieres el resultado?
> - `1` — En el chat (lista markdown)
> - `2` — Insertarlo en un fichero existente

---

## Paso 3b — Fichero destino (solo si eligió `2`)

Haz estas tres preguntas, **una por turno**:

1. > ¿Cuál es la ruta del fichero? (Ejemplo: `NC_SEAT_NTTDATA_CHANGES_LOG v1.3.10.docx`, `CHANGELOG.md`)
2. > ¿Con qué título inserto la nueva sección? Escribe el título completo tal como debe aparecer en el documento (Ejemplo: `BTPHR-1059: Mejora de rendimiento en lectura de sesiones`). Si ya existe una sección con ese nombre, añado el contenido dentro de ella sin crear duplicado.
3. > ¿Respeto el formato y estilo de las entradas existentes? (`sí` / `no`)
   > - Si `sí` y es `.docx`: clonaré los estilos de lista de las entradas de Frontend más cercanas (niveles 0, 1 y 2).

---

## Paso 3c — Autor de los cambios (solo si destino = `.docx`)

Ejecuta `git config user.name`. Si el resultado es un nombre completo legible (contiene al menos dos palabras), úsalo directamente sin preguntar. Si es un alias técnico (un solo token, sin espacios), pregunta:
> ¿Cuál es tu nombre completo? Lo usaré como autor en las marcas de revisión del documento.

---

## Paso 4 — Nivel de detalle (opcional)

Pregunta como un único mensaje con las tres opciones juntas, ya que son secundarias:
> Opciones de detalle (responde con tus preferencias o escribe `ok` para usar los valores por defecto y continuar):
> - ¿Desglose por fichero + método/vista cuando se detecte? (por defecto: `sí`)
> - ¿Incluir ficheros eliminados/renombrados? (por defecto: `sí`)
> - ¿Rutas completas o relativas? (por defecto: `relativas`)

Si el usuario responde `ok` o no modifica ningún valor, aplica los defaults y avanza directamente a la ejecución.

---

## Ejecución

Una vez recogidos todos los parámetros:

1. Obtén el diff con el comando adecuado según el origen elegido:
   - Sin commit: `git status` + `git diff HEAD`
   - Entre ramas: `git diff <rama-base>...HEAD --name-status` y luego `git diff <rama-base>...HEAD`
2. Analiza cada fichero modificado e infiere el elemento interno (controlador, vista, fragmento, modelo, utils) cuando sea posible.
3. Genera la salida según el destino:
   - **Chat**: lista markdown con los campos Archivo, Elemento, Tipo de cambio, Resumen y Razón por cada entrada. Agrupado por fichero.
   - **Fichero `.docx`**: usa `python-docx` con el entorno `.venv` del workspace. Clona los estilos de párrafo de las entradas Frontend existentes (niveles 0, 1, 2 de lista). No modificar nada fuera de la sección indicada.
   - **Fichero `.md` / `.txt`**: añade el contenido en la sección indicada con el mismo estilo de headings del resto del fichero.

---

## Reglas

- No inventar cambios: basarse únicamente en el diff real.
- **Listar todos los ficheros modificados sin excepción**, independientemente de su tipo: `.js`, `.xml`, `.css`, `.properties` (i18n), imágenes, `.json`, `.yaml`, `.html`, etc.
- Priorizar claridad y brevedad en cada descripción.
- Agrupar por fichero y mantener orden estable (mismo orden que devuelve el diff).
- Si el destino es `.docx`, el intérprete Python a usar es `/ruta-workspace/.venv/bin/python`; localizarlo con `find` si no se conoce.
- Si el `.docx` tiene revisiones `w:ins` existentes (Track Changes), envolver cada nuevo párrafo y run en `w:ins` con el autor y la fecha actuales. El autor se obtiene ejecutando `git config user.name` — si devuelve un valor válido (no vacío ni un alias técnico de un solo token sin espacios), usarlo directamente. Si no es un nombre completo legible, pedírselo al usuario antes de continuar. La fecha se toma del sistema (`datetime.utcnow()` en formato `YYYY-MM-DDTHH:MM:SSZ`). No reutilizar el autor del último `w:ins` existente en el documento.
