---
applyTo: '**'
---

# Seguridad en edición de ficheros con replace_string_in_file

Estas reglas aplican cada vez que se use `replace_string_in_file` o `multi_replace_string_in_file` para modificar un fichero existente.

## Regla 1 — Contexto posterior obligatorio tras una inserción

Cuando el objetivo es **insertar** código nuevo (el `oldString` no se elimina, sólo se añade contenido antes o después), el `oldString` debe extenderse **al menos 2 líneas más allá del punto de inserción** y esas mismas líneas deben aparecer idénticas al final del `newString`.

**Mal (puede perder la línea de ancla):**
```
oldString: `\t"use strict";\n\treturn Foo.extend(`
newString:  `\t"use strict";\n\tvar X = 1;\n\treturn Foo.extend(`
```

**Bien (ancla asegurada con líneas posteriores):**
```
oldString: `\t"use strict";\n\treturn Foo.extend("myApp", {\n\n            onInit`
newString:  `\t"use strict";\n\tvar X = 1;\n\treturn Foo.extend("myApp", {\n\n            onInit`
```

## Regla 2 — Verificar tras ediciones estructurales

Tras cualquier edición que afecte a:
- La declaración `return` de un módulo AMD (`sap.ui.define`)
- El `extend` de un controlador, fragmento o componente
- Los corchetes/llaves de cierre del módulo

...se debe leer el bloque afectado con `read_file` para confirmar que la estructura es correcta antes de continuar con la siguiente edición.

## Regla 3 — No solapar oldString con newString en límites estructurales

Si el `oldString` termina exactamente en una línea que forma parte de la estructura del módulo (apertura/cierre de objeto, `return`, `});`), el `newString` **debe reproducir esa línea íntegramente** al final, sin truncarla ni omitirla.

## Regla 4 — Leer antes de editar bloques largos omitidos

Si el fragmento del fichero a editar contiene secciones marcadas como `/* Lines X-Y omitted */` (resumen del asistente), se debe usar `read_file` para leer esas líneas exactas **antes** de construir el `oldString`, ya que el texto real puede diferir del resumen.
