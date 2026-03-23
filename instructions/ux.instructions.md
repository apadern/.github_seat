---
applyTo: '**'
---

# Directrices UX para vistas SAPUI5

Este documento recoge las reglas de interfaz de usuario que debe mantener el perfil funcional al diseñar o revisar vistas de la aplicación. Las reglas aplican a **todas las pantallas** del proyecto.

> **¿Quién usa este documento?**
> El perfil funcional: la persona responsable de definir y validar el diseño de pantallas. No se requiere conocimiento técnico de UI5.

---

## 1. Cabecera (franja superior de la pantalla)

La cabecera es la franja negra que aparece en la parte superior de todas las pantallas. Su aspecto y contenido deben ser siempre los mismos.

### 1.1 Reglas de la cabecera

| Elemento | Posición | Descripción |
|---|---|---|
| Logo SEAT en blanco | Extremo **izquierdo** | Siempre visible en todas las pantallas |
| Etiqueta **INTERNAL** | Centro-derecha, **antes** del menú | Solo si la pantalla está marcada como uso interno. Ver sección 1.2 |
| Menú hamburguesa (≡) | Extremo **derecho** | Solo si la pantalla tiene opciones de menú. Si no hay opciones, no se muestra |

**Esquema visual:**

```
╔══════════════════════════════════════════════════════════╗
║  [Logo SEAT blanco]            [INTERNAL]  [≡ Menú]     ║  ← Cabecera negra
╚══════════════════════════════════════════════════════════╝
```

### 1.2 Etiqueta INTERNAL

- La etiqueta INTERNAL indica que la pantalla es de uso interno de la empresa.
- Visualmente se muestra como un **recuadro con borde blanco** y texto "INTERNAL" en blanco, sobre el fondo negro de la cabecera.
- Se posiciona **justo a la izquierda del menú hamburguesa**.
- Si la pantalla no requiere esta etiqueta, simplemente no aparece; el menú hamburguesa queda en el extremo derecho.

**Comparativa visual:**

```
Sin etiqueta INTERNAL:
╔══════════════════════════════════════════════════════════╗
║  [Logo SEAT blanco]                           [≡ Menú]  ║
╚══════════════════════════════════════════════════════════╝

Con etiqueta INTERNAL:
╔══════════════════════════════════════════════════════════╗
║  [Logo SEAT blanco]                [INTERNAL]  [≡ Menú] ║
╚══════════════════════════════════════════════════════════╝
```

---

## 2. Botón Back (volver)

El botón Back permite al usuario regresar a la pantalla anterior.

### 2.1 Cuándo añadirlo

- **Pantalla principal** (la primera que ve el usuario al abrir la aplicación): **NO** lleva botón Back.
- **Cualquier otra pantalla** (detalle, formulario, resultado…): **SÍ** lleva botón Back.

### 2.2 Dónde colocarlo

- En la **esquina superior izquierda del contenido**, inmediatamente debajo de la cabecera negra.
- Debe ser el **primer elemento visible** de la pantalla, antes del título, filtros o tabla.

**Esquema visual:**

```
╔══════════════════════════════════════════════════════════╗
║  [Logo SEAT blanco]                [INTERNAL]  [≡ Menú] ║  ← Cabecera negra
╚══════════════════════════════════════════════════════════╝
  [ < Back ]                                                ← Botón Back
  ──────────────────────────────────────────────────────
  Título de la pantalla
  Filtros / Contenido
```

### 2.3 Comportamiento

- Al pulsar Back, el usuario vuelve a la pantalla anterior dentro de la aplicación.
- El texto del botón es siempre **"Back"** y lleva el icono de flecha hacia la izquierda ( ← ).

---

## 3. Pantallas de listado

Las reglas de esta sección aplican a **todas las pantallas que muestran una tabla de registros**.

### 3.1 Bloque de filtros

- Cada filtro lleva su **etiqueta (título) encima** del campo de entrada, nunca a su lado.
- El bloque completo de filtros se sitúa **encima de la tabla** a la que pertenece.
- Si hay muchos filtros, pueden distribuirse en varias filas, siempre encima de la tabla.

**Esquema visual:**

```
  Etiqueta filtro 1     Etiqueta filtro 2     Etiqueta filtro 3
  [ Campo filtro 1 ]    [ Campo filtro 2 ]    [ Campo filtro 3 ]   [Buscar]  Borrar
  ────────────────────────────────────────────────────────────────────────────────
  Título de la tabla: 45
  ...tabla...
```

### 3.2 Botones de filtros

| Botón | Tipo | Posición |
|---|---|---|
| **Buscar** | Botón **principal** (verde/destacado) | A la derecha de los filtros, en la misma fila |
| **Borrar** | Botón **secundario** (texto plano, sin fondo) | A la derecha del botón Buscar |

### 3.3 Título de la tabla

- Encima de la tabla, alineado a la izquierda, con el formato: **`Nombre de la sección: {número de registros}`**
- Ejemplos: `Procedure definitions: 45` · `Communications: 17`

### 3.4 Botones de acción de la tabla

- Todos los botones que afectan a los datos de la tabla se colocan **encima de la tabla, alineados a la derecha**, en la misma línea que el título.
- Orden de aparición (de izquierda a derecha): primero los botones secundarios, después los botones principales.

**Botones principales** (fondo verde, texto en negro):

| Acción | Formato | Icono |
|---|---|---|
| Crear nuevo registro | Botón principal con **texto** e icono | `+ Crear nuevo…` |

**Botones secundarios** (sin fondo destacado):

| Acción | Formato | Icono |
|---|---|---|
| Descargar contenido de la tabla | Solo **icono**, sin texto | Icono de Excel / descarga |

**Esquema visual:**

```
  Título de la sección: 45          [ ↓ ]   [ + Crear nuevo registro ]
  ────────────────────────────────────────────────────────────────────
  cabecera tabla...
```

### 3.5 Cabecera de la tabla

- Las celdas de cabecera tienen **fondo color arena (sand)**.
- El texto de la cabecera es **negro y negrita**.

### 3.6 Columna de acciones (última columna)

- La última columna de la tabla **no lleva título**.
- Contiene los botones de acción por fila: **editar**, **borrar**, **descargar** (solo los que apliquen).
- Los botones de esta columna muestran **únicamente el icono**, sin texto.

| Acción | Icono de referencia |
|---|---|
| Editar | Lápiz ✏ |
| Borrar | Papelera 🗑 |
| Descargar | Flecha hacia abajo ↓ |

### 3.7 Varios listados relacionados en la misma pantalla

- Si una pantalla contiene **dos o más listados relacionados**, se organizan bajo **pestañas (tabs)**.
- Cada pestaña lleva el nombre descriptivo del listado que contiene.
- Las reglas de filtros, título y botones de acción aplican de forma independiente dentro de cada pestaña.

### 3.8 Campos Sí / No

- Los campos con valores **Sí / No** se muestran siempre como un **checkbox** (casilla de verificación).
  - **Sí** → casilla marcada ☑
  - **No** → casilla desmarcada ☐
- El checkbox es solo de lectura en la vista de listado; no se puede modificar directamente desde la tabla.

### 3.9 Campo ID

- Si los registros de la tabla tienen un campo **ID** (identificador), este debe colocarse en la **primera columna**.
- El valor del ID se muestra en **negrita**.

---

## 4. Checklist de revisión UX (por pantalla)

### Cabecera y navegación

- [ ] La cabecera es negra y ocupa todo el ancho de la pantalla.
- [ ] El logo SEAT en blanco está en el extremo izquierdo de la cabecera.
- [ ] Si la pantalla tiene opciones de menú, el icono hamburguesa (≡) está en el extremo derecho de la cabecera.
- [ ] Si la pantalla NO tiene opciones de menú, el icono hamburguesa NO aparece.
- [ ] Si la pantalla es de uso interno, la etiqueta INTERNAL aparece a la izquierda del menú hamburguesa.
- [ ] Si NO es la pantalla principal, incluye el botón Back en la esquina superior izquierda del contenido.
- [ ] El botón Back es el primer elemento visible bajo la cabecera.
- [ ] Al pulsar Back, el usuario regresa correctamente a la pantalla anterior.

### Pantallas de listado

- [ ] Cada filtro tiene su etiqueta encima del campo de entrada.
- [ ] El bloque de filtros está encima de la tabla.
- [ ] El botón Buscar es un botón principal (destacado).
- [ ] El botón Borrar es un botón secundario (sin fondo destacado).
- [ ] La tabla tiene un título con el formato `Nombre: {número de registros}`.
- [ ] Los botones de acción de la tabla están encima de ella, alineados a la derecha.
- [ ] El botón de creación es principal (verde, con texto e icono +).
- [ ] El botón de descarga de la tabla es secundario y muestra solo el icono (sin texto).
- [ ] La cabecera de la tabla tiene fondo arena y texto negro en negrita.
- [ ] La última columna no tiene título y contiene solo iconos de acción (editar / borrar / descargar).
- [ ] Si hay varios listados relacionados, están organizados en pestañas (tabs).
- [ ] Los campos Sí/No se muestran como checkbox (☑ / ☐).
- [ ] Si existe campo ID, está en la primera columna y el valor aparece en negrita.
