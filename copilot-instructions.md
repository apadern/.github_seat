---
applyTo: '**'
---

<!-- 
applyTo: '**' → aplicar a todos los archivos/rutas del repositorio donde Copilot vaya a generar o sugerir código
applyTo: '**/*.js' → solo JavaScript
applyTo: 'webapp/**' → solo una carpeta
applyTo: '**/*.{js,ts,xml}' → varias extensiones 
-->

## 1. Introducción e instrucciones para la generación de código
Este documento presenta las mejores prácticas para desarrollar aplicaciones usando SAPUI5, con el objetivo de mejorar la calidad del código y la experiencia de usuario.

- Tu objetivo es proporcionar ejemplos de código y orientación que sigan las mejores prácticas en modularidad, rendimiento y mantenibilidad, siguiendo un tipado estricto, convenciones de nombres claras y la guía de estilos oficial de SAPUI5.
- Debes seguir las instrucciones y pautas proporcionadas a continuación para garantizar que el código generado sea claro, mantenible y cumpla con los requisitos del proyecto.
- Cuando respondas a una solicitud debes responder en español.
- No es necesario que generes comentarios con respuestas a la solicitud que has recibido. Si se añade un comentario es porque aporta para entender el código o para explicar algo que no es evidente.

Utiliza la herramienta `get_guidelines` del servidor UI5 MCP para obtener los últimos estándares de codificación y mejores prácticas para el desarrollo de UI5. Esto te ayudará a generar código que cumpla con las expectativas de calidad y estilo del proyecto.

## 2. Idioma
**Comentarios**: Todos los comentarios deben estar en **español primero** seguido de inglés, separados por " / " ("Descripción en español / English description"). El orden español/inglés es obligatorio y debe respetarse de forma consistente en todos los ficheros.

**Código**: Los nombres de funciones, variables y clases CSS deben estar en inglés.

## 3. Estructura del Proyecto
**Organización de carpetas**: Organice los archivos de su proyecto en una estructura de carpetas lógica que refleje la arquitectura de la aplicación.
- `view/`: Contiene las vistas de la aplicación.
- `fragment/`: Contiene los fragmentos de la aplicación, partes de código reutilizables.
- `controller/`: Contiene los controladores para manejar la lógica de las vistas.
- `control/`: Contiene los nuevos controles personalizados.
- `model/`: Contiene los modelos de datos.
- `i18n/`: Archivos de traducción.
- `css/`: Archivos de estilos CSS.
- `utils/`: Funciones y módulos de utilidad.
- `imagen/`: Imágenes y recursos gráficos.

**Otros archivos**:
- `Component.js`: Gestiona la inicialización de la aplicación, la creación de instancias y modelos.
- `manifest.json`: Define la configuración de la aplicación, incluyendo metadatos, rutas, modelos, componentes y dependencias, lo que facilita la gestión y el mantenimiento de la aplicación de forma estructurada.
- `index.html`: Punto de entrada de la aplicación, donde se carga el framework SAPUI5 y se inicia la aplicación.

## 5. Gestión de Datos
**Modelos**: Utilice modelos JSON u OData para gestionar los datos de forma eficiente.

**Binding**: Implementa data binding para sincronizar la vista con el modelo.

**Actualización de propiedades del modelo**: Cuando sea necesario modificar el valor de una propiedad en un modelo de datos (JSONModel u ODataModel), debe utilizarse el método `setProperty()` en lugar de invocar `refresh()` sobre el modelo completo. Cuando se deben actualizar los datos de un modelo oData no se debe hacer `refresh()` del modelo completo, sino que se debe actualizar el binding del control en concreto.

El uso de `setProperty()`:
- Actualiza únicamente la propiedad afectada.
- Dispara automáticamente el data binding correspondiente.
- Mejora el rendimiento al evitar recargas innecesarias.
- Reduce efectos secundarios no deseados.

No se debe utilizar refresh() para forzar la actualización de datos cuando únicamente cambia una propiedad específica, ya que implica una actualización completa del modelo y puede afectar negativamente al rendimiento y a la experiencia de usuario. El método refresh() solo debe utilizarse cuando sea estrictamente necesario volver a sincronizar el modelo completo con su fuente de datos.

Ejemplo:
```
this.getView().getModel().setProperty("/status", "approved");
```

Ejemplo OData:
```
this.getView().byId("myControl").getBinding("items").refresh();
```

## 6. Accesibilidad
**Patrón MVC**: El desarrollo de la aplicación utilizará el patrón Modelo-Vista-Controlador (MVC), que en SAPUI5 se emplea para separar la representación de la información en partes independientes según la interacción del usuario. Esta separación en módulos facilita el desarrollo y las posibles modificaciones de los componentes del proyecto.

## 7. Rendimiento
**Inicialización**: Asegurar de que la aplicación no bloquea la renderización de la vista mientras espera una solicitud de retroceso. Esto perjudica la experiencia del usuario. Se recomienda cargar la página de forma asíncrona y renderizarla mientras la solicitud de retroceso aún está en curso.
Para ello, configure la propiedad "async" en "true" en la configuración de "rootView" y también en "routing/config" en Manifest.json. De esta manera, se pueden realizar diferentes solicitudes sin tiempos de espera excesivos.
No es necesario identificar todos los elementos visuales, para ello, se configurará la propiedad "flexEnabled" en "false" en el archivo Manifest.json, dentro de "sap.ui5".
Todas las librerias UI5 que se usan de forma frequente en la aplicación se deben definir y cargar desde el manifest.json, dentro de "sap.ui5" → "dependencies" → "libs". De esta forma, se evitan cargas innecesarias y se mejora el rendimiento.

**Lazy Loading**: Implemente la carga diferida de componentes para mejorar el rendimiento.

**Expression Binding**: Se recomienda utilizar lógica en las vistas, ya que permite proporcionar expresiones en lugar de funciones de formato personalizadas, lo que ahorra la sobrecarga de definir una función; además, se recomienda en casos donde la función de formato tiene una implementación trivial, como la comparación de valores.

**Operadores ternarios**: Siempre que la lógica condicional sea simple (por ejemplo, asignaciones directas basadas en una condición), utilice el operador ternario en lugar de estructuras if/else tradicionales. Esto mejora la concisión y legibilidad del código cuando se trata de decisiones binarias simples.

Se recomienda su uso en:
- Asignaciones condicionales.
- Retornos directos en funciones.
- Expresiones simples sin efectos secundarios.

Evite el uso de operadores ternarios (en esos casos, utilice estructuras if/else tradicionales) cuando:
- Existan múltiples condiciones anidadas que afecten la legibilidad.
- Se requieran bloques de ejecución complejos.
- La expresión comprometa la claridad del código.

Ejemplo:
```
const sSection = sStatus === "initial" ? "first" : "second";
```

**Refactorización**: Dividir las funciones que realizan múltiples tareas en funciones más pequeñas y específicas es una buena práctica de programación. Esto no solo mejora la legibilidad y el mantenimiento del código, sino que también facilita su reutilización y las pruebas. Aplicar el principio de responsabilidad única promueve un diseño de software más limpio y eficiente, lo que se traduce en un desarrollo más ágil y libre de errores.

**Herencia entre controladores**: Los controladores son objetos que permiten la herencia. Por esta razón, en los proyectos se debe usar un controlador base (llamado "padre") que contenga los métodos comunes a varios controladores. De esta forma, la misma función no se duplicará en diferentes controladores.

Nota: Si dos funciones realizan la misma acción, tienen el mismo nombre y existen en dos controladores distintos, centralice esa lógica en una única función dentro de `App.controller` y haga que los controladores hijos la reutilicen. Esto evita duplicación y facilita el mantenimiento.

Ejemplo de un controlador que hereda de App.controller:
```
sap.ui.define([
  "projectname/controller/App.controller"
],
function (AppController) {
  "use strict";

  return AppController.extend("projectname.controller.Search", {

    onInit: function () {
      AppController.prototype.onInit.apply(this, arguments);
    }
  });
});
```

**Identificación de controles**: Para evitar problemas con IDs duplicados (especialmente cuando se usan Fragments) y cumplir las pautas del proyecto, identifique controles por su posición/agrupación en la vista y por metadata en lugar de usar ids globales (mediante la propiedad "id"). Es más correcto identificar en el controlador un elemento por su posición en la vista.

Estos elementos se identifican en la función `onInit()` del controlador para su uso en otras funciones.

Pautas prácticas:
- Use getAggregation()/getContent()/getItems() para recorrer la jerarquía.
- Use getMetadata().getName() y propiedades relevantes (text, alt, class) para identificar controles.
- Guarde referencias en this.* en onInit() para evitar busquedas repetidas.

Ejemplo:
```
onInit: function () {
  //declare CONTROLS
  this.oPopupSettings = this.oTable.getExtension()[0].getContent().find((oControl) => oControl.getMetadata().getName() === "sap.m.p13n.Popup");
},
```

## 8. Testing
**Unit Testing**: Implemente pruebas unitarias para garantizar la calidad del código.

**Integration Testing**: Realizar pruebas de integración para verificar que los componentes funcionan correctamente juntos.

## 9. Estilo
**Descripción general**: Todo el estilo personalizado que desee definir en una aplicación, que difiera del estilo predefinido de SAP, se declarará en el archivo `style.css` dentro de la carpeta "css" de la aplicación web.

**Directrices**:
- SAPUI5 proporciona varias clases CSS predefinidas para añadir márgenes o relleno a un elemento visual.
Ejemplo:
```
<IconTabBar class="sapUiResponsiveContentPadding sapUiMediumMarginBeginEnd">
```

- Utilice siempre clases (y la menor cantidad posible), nunca identificadores, para hacer referencia a un elemento de la vista. Considere también reutilizar clases para elementos a los que se les aplique el mismo estilo visual.

- Intente utilizar un sistema de nombres común para las clases referenciadas, donde la nomenclatura se refiera a la función del elemento, no a su apariencia.

- Evite, en la medida de lo posible, sobrescribir las reglas CSS de las clases estándar de SAP.

- Utilice la menor cantidad posible de directivas "!important".

- No repita código CSS. Si dos clases aplican las mismas reglas, escríbalas debajo (entre comas).

- Intente organizar el código CSS si el proyecto es muy grande, dividiéndolo en secciones comentadas.

- En cuanto a las diferencias visuales entre distintos dispositivos, utilice consultas de medios (@mediaqueries), evitando los anchos fijos siempre que sea posible.

- Declare variables al hacer referencia a códigos de color.
Ejemplo:
```
:root {
    --first-color: #488cff;
}

.vboxSearch {
    background-color: var(--first-color);
}
```

- Utilice atributos en línea siempre que sea posible.
Ejemplo:
```
h1 {
    margin: 1em 0 2em 0;
}
```

## 10. Formateo de Código
**Formato de vistas**: Todas las vistas deben estar formateadas con **una línea por control visual**. Es decir, un control visual **no** debe dividirse en varias líneas por cada una de sus propiedades o eventos.
Esta regla aplica a **todos los controles visuales**, **excepto** a `<mvc:View/>`, que **sí** se formateará con **una línea por cada propiedad declarada**.
Ejemplo:
```
<Button id="btnSave" text="Guardar" type="Emphasized" enabled="{/canSave}" press=".onSave" />
<Input id="inpName" value="{/name}" placeholder="Nombre" liveChange=".onNameChange" />
```

**Tabulación (Tab Size)**: Todos los archivos de **vista**, **controlador** y `manifest.json` deben estar indentados utilizando un **Tab Size de 4**.

## 11. Control de Versiones
**GIT**: Se utilizará GIT como sistema de control de versiones, ya que permite un registro detallado de todos los cambios realizados en el código fuente.

**Instrucciones**: Con respecto a las diferentes instrucciones para subir cambios al repositorio de código, se deben tener en cuenta las siguientes directrices:
- La descripción de la instrucción **Commit** siempre será un texto escrito claro, conciso y completo del cambio realizado. Es más importante explicar el motivo del cambio que describirlo en sí, ya que el cambio exacto se inferirá del código.
- Antes de crear una **nueva rama**, es necesario realizar un pull para asegurarse de que se está trabajando en la última versión. De esta manera, se reduce la posibilidad de conflictos posteriores.

## 12. Conclusión
Siguiendo estas buenas prácticas, podrá desarrollar aplicaciones SAPUI5 más eficientes, fáciles de mantener y accesibles.