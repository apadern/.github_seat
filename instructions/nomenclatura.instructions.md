---
applyTo: '**'
---

# Convenciones de nomenclatura de SAPUI5
Este documento describe las convenciones de nomenclatura que se deben seguir al desarrollar aplicaciones con SAPUI5. El cumplimiento de estas convenciones ayuda a mantener la coherencia y la claridad en el código fuente, lo que facilita la colaboración entre desarrolladores y la comprensión del trabajo de los demás.

## 1. Nombres de clase
**Formato**: `Namespace.SubPackage.ComponentName`

**Descripción**: Los nombres de clase deben estructurarse para reflejar el espacio de nombres de la aplicación y el componente específico. Esto ayuda a organizar el código y a evitar conflictos de nombres. El nombre del componente **no** debe incluir el sufijo del sub-paquete (p. ej., no añadir `Controller` aquí; ese sufijo es propio de los controladores según la sección 2).

Ejemplo:
- `MyApp.controller.Main` para una clase de controlador (el sufijo `Controller` se añade según la sección 2).
- `MyApp.model.UserModel` para una clase de modelo.
- `MyApp.view.Detail` para una clase de vista.

## 2. Nombres de controlador
**Formato**: `Namespace.ComponentNameController`

**Descripción**: Los controladores siempre deben terminar con el sufijo `Controller` para indicar claramente su función en la arquitectura MVC.

Ejemplo:
- `MyApp.controller.MainController` para el controlador principal.
- `MyApp.controller.DetailController` para un controlador detallado.

## 3. Nombres de las vistas
**Formato**: `ComponentName.view.xml`

**Descripción**: Los archivos de vista deben nombrarse de forma que reflejen su propósito, seguidos del sufijo `.view.xml`. El nombre base **no** debe incluir la palabra "View" para evitar la redundancia `MainView.view.xml`; el sufijo `.view.xml` ya lo indica.

Ejemplo:
- `Main.view.xml` para la vista principal.
- `Detail.view.xml` para una vista detallada.
- `ProcedureList.view.xml` para la vista de lista de procedimientos.

## 4. Nombres de los modelos

### 4.1 Variable que contiene el modelo
**Formato**: notación húngara `o` + sustantivo descriptivo

**Descripción**: Las variables que almacenan instancias de modelo siguen la notación húngara de la sección 9 (prefijo `o` al ser objetos).

Ejemplo:
- `oDataModel` para una instancia de modelo OData.
- `oJsonModel` para una instancia de modelo JSON.
- `oViewModel` para un modelo de estado de la vista.

### 4.2 Nombre registrado del modelo (string)
**Formato**: `camelCase` corto y descriptivo

**Descripción**: Cuando se registra un modelo en una vista o componente mediante `setModel(model, "nombre")`, el nombre string debe ser camelCase, breve y describir el dominio de datos, **no** el tipo técnico. Los nombres de modelo son visibles en los bindings XML (`{nombreModelo>/propiedad}`), por lo que su legibilidad es importante.

Nombres reservados por convención UI5:
- `"i18n"` — bundle de internacionalización.
- `"view"` — modelo de estado local de la vista (p. ej., visibilidad de controles).

Ejemplo:
- `"i18n"` para el bundle de textos.
- `"view"` para el JSON model con estado de la vista.
- `"procedures"` para datos de procedimientos.
- `"user"` para datos de usuario.
- Evitar nombres genéricos como `"data"` o `"model"` que no describen el dominio.

## 5. Nombres de recursos
- **Formato**: `i18n.properties`

**Descripción**: Los archivos de recursos, como los de internacionalización, deben nombrarse de forma que indiquen su función. El prefijo `i18n` se usa habitualmente para la internacionalización.

Ejemplo:
- `i18n.properties` para los recursos en el idioma predeterminado.
- `i18n_en.properties` para los recursos en inglés.
- `i18n_de.properties` para los recursos en alemán.

## 5.1. Nombres de etiquetas de i18n
**Formato**: `camelCase`

**Descripción**: Las etiquetas de i18n deben seguir una convención de nomenclatura que refleje su función y el contexto en el que se utilizan. Esto facilita la organización y la búsqueda de las etiquetas en los archivos de recursos.
En caso de etiquetas de mensajes al usuario, se recomienda usar el prefijo "msg" para indicar que se trata de un mensaje.

Ejemplo:
- `appTitle` para el título de la aplicación.
- `msgSaveSuccess` para un mensaje que indica que los datos se han guardado correctamente.
- `msgSaveError` para un mensaje que indica que ha ocurrido un error al guardar los datos.

## 6. Nombres de funciones
**Formato**: `_verbNoun` (privadas) / `verbNoun` (públicas)

**Descripción**: Los nombres de las funciones deben ser descriptivos y seguir el formato `verboSustantivo`. Se distinguen dos casos:

- **Funciones privadas** (auxiliares internas): comienzan con guion bajo (`_`). Son las que se llaman desde otras funciones del mismo controlador o módulo.
- **Funciones de ciclo de vida de UI5** (`onInit`, `onBeforeRendering`, `onAfterRendering`, `onExit`): son métodos públicos heredados del framework y **no** llevan prefijo `_`.

**Propiedades de instancia privadas**: las propiedades del controlador asignadas a `this` que son de uso interno combinan el prefijo `_` con la notación húngara de la sección 9.

Ejemplo:
- Función privada `_getUserData()` para recuperar datos de usuario.
- Función privada `_setUserData(data)` para establecer datos de usuario.
- Ciclo de vida `onInit()` — público, sin prefijo `_`.
- Propiedad de instancia `this._oWizard` — objeto privado del controlador.
- Propiedad de instancia `this._oNavContainer` — contenedor de navegación privado.

## 7. Nombres de eventos
**Formato**: `on<EventName> + actionVerb`

**Descripción**: Las funciones de controlador de eventos deben comenzar con el prefijo `on` seguido del nombre del evento. Esta convención aplica exclusivamente a los **handlers ligados a eventos de controles UI5 desde la vista XML** (press, change, select, etc.).

Los callbacks internos (manejadores del router, callbacks de promesas o de llamadas OData) son funciones privadas y siguen la convención de la sección 6: prefijo `_` y formato `_verbNoun`.

Ejemplo:
- `onInit()` para el ciclo de vida de inicialización del controlador.
- `onPressSave()` para guardar los datos de un formulario.
- `onChangeData()` para modificar los datos de un formulario.
- `onSelectItem(oEvent)` para la selección de un ítem en lista.
- `_handleRouteMatched(oEvent)` para el callback interno del router (privado, no un evento de vista).

## 8. Nombres de propiedades
**Formato**: `camelCase`

**Descripción**: Las propiedades deben nombrarse usando camelCase para mantener la coherencia con las convenciones de JavaScript.

Ejemplo:
- `userName` para la propiedad del nombre de un usuario.
- `isActive` para una propiedad booleana que indica el estado activo.

## 9. Nombres de variables
**Formato**: `camelCase` con prefijo de tipo (notación húngara)

**Descripción**: Los nombres de las variables también deben usar camelCase. Deben ser lo suficientemente descriptivos para indicar su propósito y se debe evitar el uso de nombres de una sola letra, excepto para los contadores de bucle.
Es importante evitar en lo posible el uso de variables globales, así como de modelos globales que afectan a todas las vistas.

La primera letra del nombre de la variable debe corresponder al tipo de dato de dicha variable:
- Si el elemento de datos es `Boolean`, la variable comenzará con "b".
- Si el elemento de datos es `Integer`, la variable comenzará con "i".
- Si el elemento de datos es `Float`, la variable comenzará con "f".
- Si el elemento de datos es `String`, la variable comenzará con "s".
- Si el elemento de datos es `Object`, la variable comenzará con "o".
- Si el elemento de datos es un `Array`, la variable comenzará con "a".
- Si el elemento de datos es una `Date`, la variable comenzará con "d".
- Si el elemento de datos es una `Promise`, la variable comenzará con "p".
- Si el elemento de datos es una `Function` (callback almacenado en variable), la variable comenzará con "fn".

**Alias de `this`**: cuando se necesite capturar el contexto, la variable debe llamarse `that` (nunca `t` ni `self`), ya que es un objeto.

Ejemplo:
- `aUserList` para una lista de usuarios.
- `fTotalAmount` para una variable que representa un importe total.
- `iCounter` para un contador de bucle.
- `pLoadData` para una promesa de carga de datos.
- `fnCallback` para una función almacenada como callback.
- `const that = this;` como alias del contexto del controlador.

## 10. Constantes
**Formato**: `UPPER_SNAKE_CASE`

**Descripción**: Las constantes deben nombrarse con letras mayúsculas y palabras separadas por guiones bajos. Esta convención ayuda a distinguir las constantes de las variables normales.
Las constantes deben declararse en el archivo `constants.js` dentro de la carpeta `webapp/utils/`.

> **Pendiente**: el fichero `webapp/utils/constants.js` aún no existe en el proyecto. Debe crearse y centralizar en él todas las constantes de la aplicación (URLs de endpoints, códigos de estado, tamaños máximos, etc.).

Ejemplo:
- `MAX_USERS` para el número máximo de usuarios permitidos.
- `API_URL` para la URL base de una API.
- `STATUS_ACTIVE` para un código de estado activo.

## 11. Nombres de fragmentos
**Formato**: `PascalCase.fragment.xml`

**Descripción**: Los archivos de fragmento deben nombrarse en PascalCase (cada palabra empieza en mayúscula) seguidos del sufijo `.fragment.xml`. El nombre debe describir el propósito funcional del fragmento.

Ejemplo:
- `AddUserEC.fragment.xml` para el fragmento de añadir usuario.
- `DialogPreviewHTML.fragment.xml` para un diálogo de previsualización HTML.
- `ScheduleReports.fragment.xml` para el fragmento de programación de informes.
- `SignatureFields.fragment.xml` para los campos de firma.

## 12. Nombres de ficheros de utilidad
**Formato**: `PascalCase.js` para módulos con clase / `camelCase.js` para módulos funcionales

**Descripción**: Los ficheros dentro de `webapp/utils/` siguen dos patrones según su naturaleza:

- **Módulos con clase o servicio** (exportan un objeto/clase principal): `PascalCase.js`.
- **Módulos funcionales** (exportan un conjunto de funciones): `camelCase.js`.

Ejemplo:
- `ErrorHandler.js` — módulo con clase (PascalCase).
- `formatter.js` — módulo funcional con funciones de formato (camelCase).
- `constants.js` — módulo de constantes (camelCase).
- `manageCAP.js` — módulo funcional de gestión CAP (camelCase).

## 14. Nombres de rutas y targets (routing)
**Formato rutas**: `Route` + `PascalCase` del nombre de la entidad
**Formato targets**: `Target` + `PascalCase` del nombre de la entidad

**Descripción**: Las rutas y targets se definen en `manifest.json` bajo `sap.ui5.routing`. El prefijo `Route` / `Target` hace explícito el tipo de entidad y facilita la búsqueda en código y manifesto. El sufijo en PascalCase debe coincidir con el nombre de la vista a la que apuntan.

Regla: el nombre base del target debe coincidir con el nombre base de la vista (sin el sufijo `.view.xml`).

Ejemplo:
```json
"routes": [
  { "name": "RouteProcedureList",  "target": "TargetProcedureList" },
  { "name": "RouteCreateProcedureDefinition", "target": "TargetCreateProcedureDefinition" }
],
"targets": {
  "TargetProcedureList": { "viewName": "ProcedureList" },
  "TargetCreateProcedureDefinition": { "viewName": "CreateProcedureDefinition" }
}
```

En código JavaScript, al navegar: `oRouter.navTo("RouteProcedureList", { id: sId })`.

## 15. IDs de controles en vistas XML
**Formato**: `camelCase` descriptivo

**Descripción**: Los atributos `id` de controles UI5 en vistas XML deben seguir camelCase y ser lo suficientemente descriptivos para identificar el control y su función. El framework añade automáticamente el prefijo de la vista al renderizar, por lo que **no** se debe incluir el namespace del componente manualmente.

Evitar:
- Nombres genéricos: `button1`, `table`, `input`.
- Incluir el tipo del control como sufijo redundante cuando el contexto es claro: `saveButtonButton`.

Ejemplo en XML:
```xml
<Button id="saveButton" />
<Table id="proceduresTable" />
<Input id="titleInput" />
<Dialog id="addUserDialog" />
```

En JavaScript, acceso al control: `this.byId("saveButton")`.

## 16. Clases CSS personalizadas
**Formato**: `kebab-case` con prefijo de proyecto

**Descripción**: Las clases CSS personalizadas deben:
- Usar `kebab-case` (palabras en minúsculas separadas por guiones).
- Llevar un prefijo corto del proyecto para evitar colisiones con las clases SAP (`sapUi`, `sapM`, etc.) y con librerías externas.
- **Nunca** usar el prefijo `sapUi` o `sapM`, reservados para el propio framework.

**Prefijo recomendado para este proyecto**: `pdef-` (abreviatura de *Procedures Definition*).

Ejemplo:
```css
.pdef-header-toolbar { ... }
.pdef-btn-primary    { ... }
.pdef-signature-area { ... }
.pdef-table-compact  { ... }
```

En XML: `<Toolbar class="pdef-header-toolbar" />`.

## 17. Ficheros de test
**Formato**:
- Tests unitarios: `[NombreControlador].unit.js`
- Journeys OPA5: `[Funcionalidad]Journey.js`
- Page objects OPA5: `[NombreVista]Page.js`
- Suites de agregación: `AllTests.js` / `AllJourneys.js`

**Descripción**: Los ficheros de test deben ubicarse en `webapp/test/` y seguir la estructura:

```
test/
  unit/
    controller/
      ProcedureList.unit.js
      CreateProcedureDefinition.unit.js
    AllTests.js
    unitTests.qunit.html
  integration/
    pages/
      ProcedureListPage.js
      CreateProcedureDefinitionPage.js
    NavigationJourney.js
    AllJourneys.js
    opaTests.qunit.html
```

Cada fichero de test unitario debe cubrir el controlador o módulo de utilidad con el mismo nombre base. Los journeys describen flujos de usuario completos y deben nombrarse con un verbo-sustantivo que describa la acción: `CreateProcedureJourney.js`, `NavigationJourney.js`.