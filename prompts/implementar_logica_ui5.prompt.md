---
name: implementar_logica_ui5
description: "Implementa la logica funcional de un controlador SAPUI5: modelos de datos (OData V2/V4, REST, Mock), handlers de eventos, CRUD, BaseController, formatters, lifecycle completo con onExit, mensajeria al usuario y estado de viewModel."
agent: Agente_logica
argument-hint: "Nombre del controlador y flujos funcionales (ej: CustomerDetail — cargar cliente por ID, editar y guardar via OData V4)"
---

Actua como el Agente de Logica SAPUI5. Implementa la logica funcional del controlador a partir de los siguientes parametros.

Los marcados con `*` son obligatorios.

---

## Identificacion *

- **Nombre del controlador / vista**: {{namespace}}
- **Ruta del controlador**: {{controllerName}}

---

## Fuente de datos *

- **Tipo** (`odata-v4` | `odata-v2` | `rest` | `mock`):
- **URL del servicio**: (ej: `/sap/opu/odata/sap/MY_SERVICE/` o `/api/customers`)
- **Metadata / contrato**:

  Pega aqui la metadata OData, el contrato swagger/openapi, o describe:
  - Entidades / recursos disponibles
  - Propiedades de cada entidad
  - Operaciones (actions/functions/endpoints)
  - Relaciones ($expand)

---

## Flujos funcionales *

Describe los casos de uso que debe implementar este controlador:

1. (ej: Al navegar con un `CustomerId` en la ruta, cargar los datos del cliente)
2. (ej: Al pulsar "Editar", habilitar el modo edicion en el formulario)
3. (ej: Al pulsar "Guardar", validar campos obligatorios y hacer PATCH al servicio)
4. (ej: Al pulsar "Cancelar", descartar cambios y volver al modo display)
5. (ej: Al pulsar "Eliminar", pedir confirmacion y borrar el registro)

---

## Validaciones de negocio

- (ej: El campo "Email" es obligatorio y debe tener formato valido)
- (ej: No se puede guardar si el nombre tiene menos de 3 caracteres)
- (ej: La fecha de inicio debe ser anterior a la fecha de fin)

---

## Eventos declarados en la vista (del XML)

Lista los eventos que ya existen en la vista para que el agente los implemente:

| Evento | Control / ID | Handler esperado |
|---|---|---|
| (ej: press) | (ej: Button id="btnSave") | (ej: onSave) |
| (ej: press) | (ej: Button id="btnEdit") | (ej: onEdit) |
| (ej: change) | (ej: Input id="inputEmail") | (ej: onEmailChange) |

---

## Reglas tecnicas

- **Version UI5** (`1.108+` | `legacy`):
- **Lenguaje** (`js` | `ts`):
- **Existe BaseController?** (`si, en webapp/controller/BaseController.js` | `no — crear si hay >=2 controladores`):
- **Existen formatters?** (`si, en webapp/model/formatter.js` | `no — crear`):
- **Paginacion / filtros / sort** (especifica si aplica):

---

## Contexto del proyecto (opcional pero recomendado)

- [Vista XML del controlador](../../proceduresdefinitionui5/webapp/view/)
- [manifest.json](../../proceduresdefinitionui5/webapp/manifest.json)
