---
name: generacion_doc_jsdoc_completa
description: "Genera o actualiza la documentación JSDoc completa de un módulo SAPUI5: añade bloques JSDoc a todas las funciones, comentarios inline donde la lógica no sea autoexplicable, encabezados de archivo y valida la cobertura final."
agent: Agente_documentacion
argument-hint: "Ruta del módulo o controlador a documentar (ej: webapp/controller/ProcedureList.controller.js o webapp/ para todo el módulo)"
---

Actúa como el Agente de Documentación SAPUI5 en **Modo Completo**. Genera la documentación JSDoc a partir de los siguientes parámetros.

Los campos marcados con `*` son obligatorios.

---

## Identificación *

- **Ruta del módulo** (carpeta raíz con `package.json`):
- **Archivos a documentar** (`*` para todo el módulo, o ruta concreta):

---

## Modo de ejecución *

- **Modo**: `Completo` (todos los archivos elegibles) | `Incremental` (solo archivos indicados arriba)

---

## Estado actual de la documentación

- ¿Existe ya la carpeta `jsDoc/` en el módulo? (`sí` / `no` / `no sé`)
- ¿Está instalada la librería `jsdoc` como devDependency? (`sí` / `no` / `no sé`)

---

## Restricciones / convenciones del proyecto (opcional)

- Prefijo de funciones privadas:
- Namespace del proyecto (ej: `ProcedureList`):
- Otros ficheros a excluir además de los estándar (`test/`, `extLibs/`, vendor):

---

## Agente y reglas
- Aplica las reglas definidas en `.github/instructions/jsdoc.instructions.md`; no las repitas ni las contradijas en el output.
- Antes de instalar dependencias o crear carpetas en el repositorio, pedir confirmación al usuario.

## Recomendaciones operativas (no obligatorias pero preferidas)
- Ejecutar JSDoc desde la raíz del módulo (carpeta con `package.json`):
   ```bash
   ./node_modules/.bin/jsdoc -c jsDoc/jsDocConf.json
   # o usar npm script: npm run docs
   ```
- No iniciar `ui5 serve` automáticamente sin confirmación del usuario; en su lugar, ofrece el comando sugiriendo puerto alternativo:
   ```bash
   npx ui5 serve --open index.html --port 8082
   ```
- Verificar tras generar que `global.html` no contiene métodos listados (proporciona un comando de verificación corto).
- Todos los comentarios deben estar en español y inglés separados por ` / `; instrucciones y prompts en español.