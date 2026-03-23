---
name: crear_vista_ui5
description: "Crea una nueva vista SAPUI5 (XML View + skeleton de controlador + CSS) a partir de una descripcion funcional o mockup. Incluye decision de arquitectura Freestyle/Fiori Elements, seleccion de FloorPlan, accesibilidad ARIA y bindings de vista preparados."
agent: Agente_interfaz
argument-hint: "Nombre de la vista y descripcion del layout (ej: CustomerDetail — formulario con campos nombre, email y tabla de pedidos)"
---

Actúa como el Agente de Interfaz SAPUI5. Genera la vista XML, el skeleton del controlador y el CSS a partir de los siguientes parámetros.

Completa todos los campos que conozcas. Los marcados con `*` son obligatorios.

---

## Identificación *

- **Namespace del proyecto**: {{namespace}}
- **Nombre de la vista**: {{viewName}}

---

## Decisión arquitectónica *

- **Tipo de app** (`freestyle` | `fiori-elements`):
- **FloorPlan**:
  - `sap.m.Page` — app simple / formulario
  - `sap.f.DynamicPage` — contenido largo, header colapsable
  - `sap.uxap.ObjectPage` — detalle de entidad con secciones
  - `sap.f.FlexibleColumnLayout` — master-detail simultáneo
  - `sap.m.Page + sap.m.Table` — worklist / lista de trabajo
- **Lenguaje** (`js` | `ts`):
- **Versión UI5** (`1.108+` | `legacy`):

---

## Descripción de la UI *

Describe el layout de la pantalla. Incluye:
- Contenedores principales (header / body / footer / secciones)
- Campos y controles (inputs, selects, tablas, botones)
- Estados visuales (campos obligatorios, enabled/disabled, visibilidad condicional)
- Validaciones visibles (asteriscos, mensajes inline)

> Pega aquí la descripción y/o adjunta una imagen o mockup.

---

## Parámetros de entrada de la vista (si aplica)

| Nombre | Tipo | Obligatorio | Fuente |
|---|---|---|---|
| (ej: CustomerId) | (string) | (sí/no) | (route params / component data / startup params) |

---

## Restricciones de estilo / theming (opcional)

- Clases CSS del proyecto a respetar:
- Variables de theming UI5 (`--sapBrandColor`, etc.):
- Fichero CSS existente a extender:

---

## Contexto del proyecto (opcional pero recomendado)

Adjunta el manifest para que el agente conozca namespace y estructura actual:

- [manifest.json](../../proceduresdefinitionui5/webapp/manifest.json)
