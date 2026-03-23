# Validación de cobertura JSDoc — detección de funciones sin documentar

## Propósito
Auditar los archivos `.js` elegibles bajo `webapp/` e identificar funciones que carecen de bloque JSDoc, encabezados de archivo incompletos y bloques JSDoc con etiquetas `@memberof` o `@method` ausentes.

---

## Triggers y cuándo usar la skill
Activar cuando el usuario pida alguna de estas acciones:
- "buscar funciones sin JSDoc"
- "detectar métodos sin documentar"
- "validar cobertura JSDoc"
- "comprobar qué funciones les falta documentación"
- o equivalentes semánticos

---

## Procedimiento

### 1 — Ejecutar el script de validación

Ejecutar desde la raíz del módulo (carpeta con `package.json`):

```bash
python3 << 'EOF'
import re, os

WEBAPP = "webapp"
EXCLUDE_DIRS = {"test", "extLibs"}
EXCLUDE_FILES = {"FileSaver.js", "xlsx.js", "locate-reuse-libs.js"}
TAB_SIZE = 4
MAX_LINE = 100

def is_eligible(path):
    rel = os.path.relpath(path, WEBAPP)
    parts = rel.split(os.sep)
    if any(p in EXCLUDE_DIRS for p in parts): return False
    if os.path.basename(path) in EXCLUDE_FILES: return False
    if "js" in parts[:-1]: return False
    return True

issues = []
files = []
for root, dirs, filenames in os.walk(WEBAPP):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for f in filenames:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            if is_eligible(p): files.append(p)

for filepath in sorted(files):
    with open(filepath, encoding='utf-8') as fh:
        raw = fh.read()
        lines = raw.splitlines()

    # Encabezado de archivo /
    # File header
    head = raw[:800]
    for tag in ('@file', '@namespace', '@author'):
        if tag not in head:
            issues.append(f"[HEADER] {filepath}: falta {tag}")

    # Longitud de líneas /
    # Line length
    for i, line in enumerate(lines, 1):
        visual = len(line.expandtabs(TAB_SIZE))
        if visual > MAX_LINE:
            issues.append(f"[LONG_LINE] {filepath}:L{i} ({visual} chars)")

    # Bloques JSDoc y posiciones /
    # JSDoc blocks and positions
    jsdoc_blocks = [(m.start(), m.end()) for m in re.finditer(r'/\*\*.*?\*/', raw, re.DOTALL)]

    # Buscar funciones /
    # Find functions
    for m in re.finditer(
        r'(\w+)\s*:\s*function\s*\(|'
        r'(on\w+|_\w+)\s*=\s*function\s*\(|'
        r'function\s+(\w+)\s*\(',
        raw
    ):
        fn_name = m.group(1) or m.group(2) or m.group(3)
        fn_pos = m.start()

        preceding = [b for b in jsdoc_blocks if b[1] <= fn_pos]
        if not preceding:
            issues.append(f"[NO_JSDOC] {filepath}: función '{fn_name}' sin JSDoc")
            continue
        closest = preceding[-1]
        between = raw[closest[1]:fn_pos].strip()

        # Si hay contenido no-vacío entre el JSDoc y la función, ese JSDoc
        # pertenece a otra función — esta no tiene documentación /
        # If non-empty content exists between JSDoc and function, that JSDoc
        # belongs to another function — this one is undocumented
        if re.match(r'^[\s,]*$', between):
            block = raw[closest[0]:closest[1]]
            if '@memberof' not in block:
                issues.append(f"[NO_MEMBEROF] {filepath}: función '{fn_name}'")
            if '@method' not in block:
                issues.append(f"[NO_METHOD] {filepath}: función '{fn_name}'")
        else:
            issues.append(f"[NO_JSDOC] {filepath}: función '{fn_name}' sin JSDoc")

if issues:
    for issue in issues:
        print(issue)
    print(f"\nTotal incidencias: {len(issues)}")
else:
    print("OK — 0 incidencias")
EOF
```

### 2 — Reportar resultados al usuario

Presentar el listado de incidencias agrupado por archivo **antes de proponer ningún cambio**.

### 3 — Proponer correcciones

Para cada `[NO_JSDOC]` o `[NO_MEMBEROF]`/`[NO_METHOD]`, seguir las reglas de `.github/instructions/jsdoc.instructions.md` para redactar el bloque JSDoc correspondiente. No modificar archivos sin confirmación del usuario.

---

## Falso negativo conocido

El script comprueba si hay un bloque `/** ... */` inmediatamente anterior a la función (solo espacios/comas entre ambos). Si existe contenido no-vacío entre el JSDoc más cercano y la función — por ejemplo un comentario de ticket como `// BTPHR-1006 INI` — ese JSDoc pertenece a otra función y la actual queda sin documentación.

**Patrón de riesgo:**
```js
// BTPHR-1006 INI
onExport: function () { ... }   // ← no detectado sin JSDoc inmediatamente encima
```

La corrección ya está incorporada en el script: el bloque `else` del chequeo de `between` reporta `[NO_JSDOC]` en este caso.

---

## Archivos excluidos

- `webapp/test/**`
- `webapp/extLibs/**`
- `webapp/**/js/**`
- `FileSaver.js`, `xlsx.js`, `locate-reuse-libs.js`
