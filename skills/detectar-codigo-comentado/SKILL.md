# Detección de código comentado (código en desuso)

## Propósito
Obtener un inventario de todas las líneas de código JavaScript comentado en los archivos elegibles de `webapp/`, descartando falsos positivos de JSDoc y comentarios descriptivos inline.

---

## Triggers y cuándo usar la skill
Activar cuando el usuario pida alguna de estas acciones:
- "buscar código comentado"
- "detectar código en desuso"
- "listar código comentado"
- "limpiar código obsoleto"
- o equivalentes semánticos

---

## Procedimiento

### 1 — Ejecutar el script de detección

Ejecutar desde la raíz del módulo (carpeta con `package.json`):

```bash
python3 << 'EOF'
import re, os

WEBAPP = "webapp"
EXCLUDE_DIRS = {"test", "extLibs"}
EXCLUDE_FILES = {"FileSaver.js", "xlsx.js", "locate-reuse-libs.js"}

def is_eligible(path):
    rel = os.path.relpath(path, WEBAPP)
    parts = rel.split(os.sep)
    if any(p in EXCLUDE_DIRS for p in parts): return False
    if os.path.basename(path) in EXCLUDE_FILES: return False
    if "js" in parts[:-1]: return False
    return True

CODE_PATTERNS = [
    r'^\s*//\s*(var|let|const|function|return|if\s*\(|for\s*\(|while\s*\(|this\.|sap\.|that\.|manageCAP\.|Helper\.|oModel|oView|oBundle|oData|setTimeout|console\.)',
    r'^\s*//.*[;{}]\s*$',
    r'^\s*//\s*\w+\.\w+\(',
]

files = []
for root, dirs, filenames in os.walk(WEBAPP):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for f in filenames:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            if is_eligible(p): files.append(p)

total = 0
for filepath in sorted(files):
    with open(filepath) as fh:
        lines = fh.readlines()
    matches = []
    for i, line in enumerate(lines, 1):
        if re.match(r'^\s*\*', line) or re.match(r'^\s*/\*', line):
            continue
        for pat in CODE_PATTERNS:
            if re.search(pat, line):
                matches.append((i, line.rstrip()[:120]))
                break
    if matches:
        total += len(matches)
        print(f"\n{filepath}:")
        for ln, text in matches:
            print(f"  L{ln}: {text.strip()}")
print(f"\nTotal hits: {total}")
EOF
```

> **Nota:** `git blame` solo es fiable cuando todos los cambios están commiteados. Si hay cambios sin commitear, el blame mostrará todas las líneas como "Not Committed Yet". Usar este script como fuente principal de detección en ese caso.

### 2 — Clasificar los resultados

Agrupar los hits en estas categorías antes de proponer cambios:

| Categoría | Criterio | Acción |
|---|---|---|
| **Migración de servicios** | Llamadas `$.get(...)` antiguas reemplazadas por su equivalente CAP/REST activo (suelen tener comentario `// CHANGE XSJS WITH CAP`) | Proponer eliminación |
| **Lógica huérfana** | Código sin equivalente activo, referencias a métodos/objetos inexistentes en el proyecto actual | Proponer eliminación |
| **Funcionalidad desactivada** | Entradas de menú, flags o llamadas que podrían recuperarse | Preguntar al usuario antes de proponer eliminar |
| **Ejemplo de uso** | Bloques marcados con `// ---> Ejemplo de uso` o similar | **Mantener** |
| **Falso positivo** | Comentarios inline explicativos que contienen palabras clave (`this.`, `sap.`, etc.) | **Mantener** |

### 3 — Presentar al usuario

Presentar el resultado agrupado por archivo y categoría, con número de línea exacto, **antes de hacer ningún cambio**. Ejemplo:

```
### BaseController.js — Migración XSJS→CAP (L165-L169)
// $.get("/xsService/readPageAccess.xsjs?view=...") — reemplazado por manageCAP.readPageAccess()

### GenericHelper.js — Lógica huérfana (L494-L521)
// Cuerpo antiguo de getFormattedDate — extracción manual de fecha; reemplazado por retorno simple
```

### 4 — Eliminar solo con confirmación

- **No eliminar sin confirmación explícita del usuario.**
- Eliminar únicamente los bloques confirmados.
- No confundir código comentado con comentarios JSDoc ni comentarios descriptivos inline.

---

## Archivos excluidos

- `webapp/test/**`
- `webapp/extLibs/**`
- `webapp/**/js/**`
- `FileSaver.js`, `xlsx.js`, `locate-reuse-libs.js`
