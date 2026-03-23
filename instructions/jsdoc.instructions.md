---
applyTo: '**'
---

## Documentación
**Descripción general**: Toda la documentación del código en los ficheros javascript propios del proyecto dentro de la carpeta `webapp/` se realizará mediante anotaciones JSDoc y comentarios inline donde sean necesarios, independientemente de la subcarpeta en la que se encuentren. Es necesario actualizar la documentación después de cada corrección o modificación en el código, actualizando la etiqueta `@memberof` con el valor de la etiqueta `@namespace` al inicio del archivo javascript.

**Nota:** La librería `jsdoc` **no es obligatoria** en el repositorio. Si `jsdoc` no está instalada en el módulo, las instrucciones siguientes siguen siendo válidas si se usa `npx jsdoc` o si se instala `jsdoc` como dependencia de desarrollo. Más abajo se muestran ejemplos de ambos enfoques.

**Directrices**:
- Añadir explicación de codigo línea a línea solo cuando la lógica no sea autoexplicable. Los comentarios inline bilingües que superen ~80 caracteres se dividirán en varias líneas: primero las líneas en español y luego las líneas en inglés, usando ` /` al final de la última línea española como separador. Ejemplo:
  ```js
  //Descripción en español parte 1,
  //parte 2 /
  //English description part 1,
  //part 2
  ```
- La documentación se aplica a **todos** los ficheros javascript propios del proyecto bajo `webapp/`, independientemente de la subcarpeta (`controller/`, `model/`, `utils/`, `helper/`, etc.), **excepto** los ficheros que sean librerías de terceros (vendor), los que estén dentro de la carpeta `test/` y el fichero `locate-reuse-libs.js`. Se consideran vendor aquellos ficheros que no han sido escritos por el equipo del proyecto; la forma más fiable de identificarlos es configurar `source.excludePattern` en `jsDocConf.json` para excluirlos.
- Al inicio del archivo javascript, se añadirá un comentario con las etiquetas `@file`, `@namespace` y `@author`. La etiqueta `@namespace` será el nombre del controlador o en caso de js nombre de fichero y la etiqueta `@author` siempre será 'NTTData'. No usar las etiquetas `@name` ni `@lends` porque la plantilla para generar la documentación no las soporta y no se indexan correctamente en la documentación generada. En su lugar, usar `@namespace` a nivel de archivo y `@memberof` + `@method` a nivel de función para que cada función se indexe correctamente bajo el namespace del archivo.

Ejemplo:
  ```
  /**
    * @file Controlador base del que heredan todos los controladores / Base controller for all controllers
    * @namespace App
    * @author NTTData
    */
  ```

- Recomendación de nombres y etiquetas (mejor práctica):
  - `@file`: descripción clara y concisa del propósito del archivo.
  - `@namespace`: se debe usar el mismo nombre para el namespace que el del controlador o fichero js para que la documentación se indexe correctamente. Por ejemplo, si el controlador se llama `App.controller.js`, el namespace será `App`. No añadir sufijos como `.controller` al namespace o la ruta del archivo para mejorar la lectura de la documentación generada.
  - En cada bloque de función publique también las etiquetas `@name` y `@memberof` con el nombre completamente cualificado para evitar que JSDoc indexe la función en `Global`.
    - Ejemplo para método de controlador (instancia):
      ```
      /**
       * @memberof App
       * @method validacionData
       * @public
       */
      ```

- Cada una de las funciones del controlador se comentará mediante anotaciones. Los comentarios solo se generarán antes de la declaración de la función; no se generarán automáticamente en medio de la misma.
Siempre se añadirán las etiquetas `@description`, `@memberof`, `@method`, `@author` y `@public`/`@private`. Si corresponde, también se añadirán las etiquetas `@async`, `@param`, `@returns` y `@throws`. 
  - Las etiquetas JSDoc bilingües (como `@description`, `@param`, `@returns`) que superen ~80 caracteres se dividirán en varias líneas usando el mismo patrón que los comentarios inline: primero las líneas en español y luego las líneas en inglés, usando ` /` al final de la última línea española como separador. Ejemplo:
    ```js
    /**
     * @description Valida que existen registros seleccionados en la tabla
     *   antes de continuar con la acción /
     *   Validates that there are selected records in the table
     *   before proceeding with the action
     * @param {Object} oTable -
     *   Tabla de origen /
     *   Source table
     */
    ```
  - Si el bloque de función ya tiene anotaciones JSDoc, se debe **fusionar** con las directrices: conservar las etiquetas correctas del bloque existente (por ejemplo, descripciones de `@param` ya redactadas) y completar o corregir las que falten o sean incorrectas. **No añadir un nuevo bloque encima del existente** — el resultado debe ser un único bloque JSDoc por función.
  - Si la funcion esta comentada no se deben añadir anotaciones jsdoc ya que se trata de una logica en desuso.

Ejemplo de una función con parámetros de entrada y un valor de retorno:
  ```
  /**
    * @description Valida que existen registros seleccionados en la tabla / Validates that there are selected records in the table
    * 
    * @memberof DetailDossier
    * @method _validLengthTable
    * @param {Object} oTable - Tabla de origen / Source table
    * @author NTTData
    * @returns {Boolean}
    * @public
    */
  ```

  - Si el desarrollador esta conforme se debe generar carpeta jsDoc si esta no existe ya a nivel de modulo (carpeta padre de webapp). En caso de tener que generarla porque el proyecto todavia no la tiene se deben seguir los siguientes pasos:
    - Carpeta customTemplate - añadir esta carpeta dentro de jsDoc. Copiar únicamente los siguientes elementos desde `.github/others/UI5/customTemplate/`: `publish.js`, `tmpl/`, `static/` y `staticSAP/`. No copiar `node_modules/`, `README.md`, `CHANGELOG.md`, `fixtures/` ni otros ficheros del repositorio de la plantilla. 
    - Fichero jsDocConf.json - copiar el fichero .github/others/UI5/jsDocConf.json dentro de la nueva carpeta jsDoc y sustituir el valor de "${project}" por el nombre del proyecto UI5.
    - Instalar librería node `jsdoc` a nivel de carpeta módulo (carpeta padre de webapp) **(opcional)**, o usar `npx jsdoc` sin instalación global/local. Ejemplos:

      ```bash
      # instalar localmente como devDependency (opcional)
      npm install --save-dev jsdoc

      # ejecutar sin instalar (usa la versión remota disponible vía npx)
      npx jsdoc -c jsDoc/jsDocConf.json

      # ejecutar binario local si está instalado
      ./node_modules/.bin/jsdoc -c jsDoc/jsDocConf.json
      ```
    - Ejecutar JSDoc siempre desde la raíz del módulo (carpeta padre de webapp) para que las rutas relativas del `jsDoc/jsDocConf.json` y `node_modules` resuelvan correctamente. Ejemplo de comando a usar desde la raíz del módulo:
      ```bash
      ./node_modules/.bin/jsdoc -c jsDoc/jsDocConf.json
      ```
      También puede añadirse un script npm en `package.json`:
      ```json
      "scripts": {
        "docs": "node_modules/.bin/jsdoc -c jsDoc/jsDocConf.json"
      }
      ```
    - Modificar apartado de modulo html5 dentro del mta.yaml a nivel de build-parameters -> commands añadiendo el comando `node_modules/.bin/jsdoc -c jsDoc/jsDocConf.json` entre `npm install` y el build. Si `npm install` no esta indicado como primer comando a ejecutar añadirlo para tener acceso a la libreria cuando se prepara el build.
    - Para previsualizar localmente la documentación generada use un servidor estático desde la carpeta de salida del `jsDoc` (por ejemplo `jsDoc/<project>_doc/.../0.0.1/`) con `ui5 serve --open index.html`.
    - Añadir al .gitignore la carpeta jsDoc/nombreProyecto_doc para evitar subir la documentación generada al repositorio.

  - Recomendaciones adicionales para el `jsDocConf.json`:
    - Asegúrese de configurar `source.includePattern` y `source.excludePattern` para evitar indexar librerías de terceros (vendor).
    - Si observa entradas en `Global` tras generar la documentación, verifique que cada archivo contiene `@namespace` correctamente cualificados y que cada función documentada tiene `@name` + `@memberof` con los nombres completos.
