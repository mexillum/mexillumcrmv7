# PRD — CRM de pipeline comercial (energía SFV/BESS)

> Versión 2 — incorpora las decisiones cerradas en la sesión de grilling del 2026-08-21.
> Los cambios respecto de la v1 están marcados como **[v2]**.

## 1. Resumen

CRM interno de pipeline de ventas, hecho a medida para un negocio de soluciones de energía (sistemas solares fotovoltaicos / SFV y almacenamiento en baterías / BESS). No es un CRM genérico: está construido alrededor de un proceso comercial concreto, desde que se identifica una empresa como posible cliente hasta que se firma el contrato.

La versión inicial es una **herramienta personal de un solo usuario**, pensada para usarse desde varios dispositivos con sincronización en la nube. El diseño es white-label (sin marca fija en la interfaz).

**Principio rector:** de menos a más. Se construye el mínimo que aporta valor y se agrega complejidad por capas, evitando dependencias de terceros cuando no son necesarias.

## 2. Objetivos

- Llevar cada oportunidad comercial ("iniciativa") por un embudo de 11 etapas con trazabilidad de qué pasó y qué sigue.
- Capturar la información del cliente de forma progresiva, hasta poder armar una propuesta con cotización.
- Registrar interacciones (notas, llamadas, reuniones, correos) y las tareas pendientes de cada iniciativa.
- Persistir todo en la nube y sincronizar en tiempo real entre dispositivos.

**Fuera de alcance (por ahora):** multiusuario y roles, colaboración con un área de ingeniería como equipo aparte, auditoría append-only inmutable, gestión de documentos adjuntos, notificaciones.

## 3. Usuario y escala

- Un solo usuario (el fundador/lead comercial).
- Escala inicial estimada: ~100 iniciativas activas.
- Uso multi-dispositivo (escritorio y móvil) sobre los mismos datos.
- **[v2]** La base de datos arranca **vacía**. No se cargan datos de demostración. Los datos de ejemplo del prototipo se conservan en un script de seed (`convex/seed.ts`) que se ejecuta solo a propósito.

## 4. Modelo de datos

Cuatro entidades de negocio más las interacciones, en una jerarquía simple:

```
Empresa
 ├── Contactos        (personas de la empresa, compartidas entre sus proyectos)
 └── Iniciativas      (proyectos / leads; una empresa puede tener varios)
       ├── Tareas         (acciones / pendientes)
       └── Interacciones  (notas, llamadas, reuniones, correos)
```

Más una tabla de configuración: **`settings`** **[v2]**, un registro por usuario.

Decisión clave: los **contactos cuelgan de la empresa, no de la iniciativa**. Si una empresa tiene tres proyectos, los mismos contactos sirven para los tres sin duplicarse.

### 4.1 Campos por entidad

**Empresa:** nombre, segmento.

**Contacto:** empresa, nombre, puesto, correo, teléfono.

**Iniciativa:** empresa, nombre del proyecto, etapa (1–11), fecha estimada de cierre, salida de pipeline (opcional), y un objeto `data` con los campos que se capturan por etapa (ver §6.1).

> **[v2] Se elimina el campo `accion`.** Ver §4.3.

**Tarea:** iniciativa, título, **fecha de vencimiento (obligatoria)** **[v2]**, completada (sí/no).

**Interacción:** iniciativa, tipo (Nota / Llamada / Reunión / Correo), fecha (sin hora), contacto (opcional), descripción.

**[v2] Settings:** un registro por usuario con el tipo de cambio `usdMxn` (número). Editable desde la interfaz.

### 4.2 Convenciones

- **Montos:** número plano en USD; cada monto USD muestra su equivalente aproximado en MXN.
- **[v2] Tipo de cambio:** vive en `settings.usdMxn`, no en el código. El usuario lo edita desde la app. No se consulta ninguna API externa.
- **Payback:** siempre derivado (CAPEX ÷ ahorro anual), nunca escrito a mano; se muestra en años.
- **Dato desconocido:** se muestra como `—`, no se inventa.
- **Fechas:** formato `YYYY-MM-DD`.

### 4.3 [v2] Próxima acción = tarea

En la v1 convivían un campo de texto `iniciativa.accion` (sin fecha) y una tabla `tareas` (con fecha). Eran lo mismo con dos formas, y el KPI "acciones vencidas" no podía funcionar sobre un texto sin fecha.

Regla nueva:

- El campo `iniciativa.accion` **desaparece**.
- La **próxima acción** de una iniciativa es, por definición, su **tarea abierta con la fecha de vencimiento más próxima**.
- Toda tarea **exige** fecha de vencimiento.
- Una iniciativa **sin ninguna tarea abierta** muestra `—` y aparece en el Panel bajo "sin próxima acción".
- Las sugerencias de próxima acción por etapa (§7) dejan de ser pistas de texto y pasan a ser **plantillas de tarea de un clic**: al elegir una se crea la tarea con esa fecha.

## 5. Catálogos

**Segmentos:** Cemento y materiales de construcción · Acero y metales · Petróleo y gas · Energía y servicios públicos · Minería · Química y petroquímica · Alimentos y bebidas · Automotriz y autopartes.

**Tarifas CFE** (código → nombre):

| Código | Nombre |
|---|---|
| `gdmth` | GDMTH — Gran Demanda Media Tensión Horaria |
| `gdmto` | GDMTO — Gran Demanda Media Tensión Ordinaria |
| `dist` | DIST o DIT — Subtransmisión / Transmisión |
| `gdbt` | GDBT — Gran Demanda Baja Tensión |
| `pdbt` | PDBT — Pequeña Demanda Baja Tensión (<25 kW) |
| `privado` | Contrato privado |

**Tipo de sistema:** SFV · BESS · SFV + BESS.
**Generador:** Mexillum · Intermepro.

## 6. Pipeline comercial

Once etapas agrupadas en cinco fases. Cada etapa tiene un criterio de entrada.

| # | Etapa | Grupo | Criterio de entrada |
|---:|---|---|---|
| 01 | Prospecto sin trabajar | Prospección | Se identificó una empresa que podría ser cliente |
| 02 | Cuenta analizada | Prospección | Existe una tesis comercial documentada con una hipótesis de valor |
| 03 | Contacto inicial enviado | Calificación | Se realizó el primer contacto con un interlocutor identificado |
| 04 | Reunión agendada | Calificación | El cliente confirmó fecha y hora |
| 05 | Diagnóstico realizado | Solución | Ocurrió la reunión y quedaron documentadas necesidades y faltantes |
| 06 | Análisis de viabilidad | Solución | El caso fue analizado con los insumos disponibles |
| 07 | Propuesta en preparación | Solución | La viabilidad fue confirmada y las bases técnicas y económicas están acordadas internamente |
| 08 | Propuesta enviada | Comercial | La propuesta fue entregada al cliente |
| 09 | Negociación | Comercial | El cliente manifestó interés y existen condiciones abiertas |
| 10 | Contrato enviado | Comercial | La versión final fue enviada para firma |
| 11 | Contrato firmado | Cierre | Ambas partes firmaron |

Las etapas 01–04 son prospección no calificada (aún pueden salir como `NO_QUALIFY`). Las etapas 05–10 constituyen pipeline calificado. La etapa 11 representa cierre ganado.

### 6.1 Etapas-hito vs. etapas-con-datos

Cada etapa es de uno de dos tipos:

- **Hito:** avanza registrando la interacción que la cumple; no tiene formulario de datos propio. Son las etapas 01, 03, 04, 08 y 10.
- **Datos:** acumula información estructurada del proyecto en un panel de campos. Son las etapas 02, 05, 06, 07, 09 y 11.

Campos que captura cada etapa-con-datos:

| Etapa | Campos |
|---|---|
| 02 Cuenta analizada | Segmento, generador, tipo de sistema, hipótesis de valor |
| 05 Diagnóstico | Recibos CFE recibidos, tarifa CFE, consumo (kWh/mes), perfil de carga |
| 06 Análisis de viabilidad | CAPEX estimado**\***, ahorro anual estimado**\***, payback (derivado) |
| 07 Propuesta en preparación | Capacidad/alcance, monto de propuesta**\***, notas de propuesta |
| 09 Negociación | Monto negociado, objeciones/notas |
| 11 Contrato firmado | Fecha de firma**\***, monto final**\*** |

**\*** Campo obligatorio: bloquea el avance de etapa si está vacío. El resto son sugeridos.

> **[v2] La validación de obligatorios vive en la mutation de Convex**, no solo en el formulario. `advanceStage` rechaza el avance si falta un campo obligatorio de la etapa actual. El formulario también valida, para dar el mensaje antes del viaje al servidor, pero la regla real está en el servidor.

### 6.2 [v2] Retroceso de etapa

Una iniciativa puede **retroceder una etapa** mediante `regressStage`, con confirmación explícita en la interfaz. Los datos ya capturados **no se borran**. Existe para corregir un clic equivocado, no como parte del flujo normal.

### 6.3 Salidas de pipeline

Una iniciativa puede salir del flujo por una de cuatro vías:

| Salida | Estado | Exige | Etapas normales |
|---|---|---|---|
| No califica | `NO_QUALIFY` | — | 01–04 |
| No viable | `NOT_VIABLE` | — | 05–07 |
| Perdido | `LOST` | Motivo; nota opcional | 03–10 |
| Retomar después | `DEFERRED` | Fecha para retomar | 01–10 |

Motivos de pérdida: Competencia, Precio, Sin presupuesto, Sin decisión, Otro.

Una salida fuera de su etapa normal se marca como excepcional y exige un reconocimiento explícito (`exceptionAcknowledged`). La etapa 11 no ofrece salidas. Una iniciativa con salida puede reabrirse (se elimina la salida).

**[v2] Visibilidad de las salidas:**

- `LOST`, `NO_QUALIFY` y `NOT_VIABLE` quedan **ocultas por defecto** en todas las listas y en el tablero. Un filtro "ver cerrados" las muestra. **Nunca cuentan en los KPIs.**
- `DEFERRED` también queda oculta, **hasta que llega su `fechaRetomar`**. Ese día la iniciativa aparece en el Panel bajo **"Para retomar"**, con un botón para reabrirla en un clic.

## 7. Registrar interacción

El mecanismo central del seguimiento. Al registrar una interacción se capturan dos bloques:

**Qué pasó:** tipo (Nota / Llamada / Reunión / Correo), fecha, contacto (opcional), descripción.

**Qué sigue:** **[v2]** crear la próxima tarea (título + fecha de vencimiento), elegida de las plantillas de la etapa o escrita a mano; o dejar las tareas como están. En etapas-hito, un check permite avanzar de etapa con la misma interacción.

Todo (interacción + tarea + avance de etapa) se guarda en una sola mutation, es decir una sola transacción.

Plantillas de tarea por etapa:

| Etapa | Plantillas |
|---|---|
| 01 | Investigar la empresa · Identificar un contacto · Preparar hipótesis de valor |
| 02 | Completar tesis comercial · Preparar contacto inicial · Validar interlocutor |
| 03 | Dar seguimiento · Intentar otro canal · Contactar otro interlocutor |
| 04 | Confirmar reunión · Preparar diagnóstico · Compartir agenda |
| 05 | Solicitar documentos · Completar información faltante · Enviar caso a Ingeniería |
| 06 | Analizar viabilidad · Solicitar información faltante · Revisar resultado técnico |
| 07 | Preparar propuesta · Validar números · Revisar propuesta internamente |
| 08 | Confirmar recepción · Agendar revisión · Dar seguimiento |
| 09 | Preparar ajuste · Resolver observaciones · Confirmar decisión |
| 10 | Dar seguimiento a firma · Resolver comentarios legales · Confirmar fecha de firma |

## 8. Vistas de la aplicación

Cinco secciones de navegación:

- **Panel:** KPIs (leads abiertos, en fase comercial, acciones vencidas, próximas 7 días) y listas de acciones vencidas, próximas, **[v2]** leads **sin próxima acción** y **[v2]** leads **para retomar** (`DEFERRED` vencidos).
- **Leads:** **[v2]** una sola página con conmutador **Tabla / Tablero**; la elección se recuerda.
  - *Tabla:* empresa, proyecto, etapa, próxima acción (la tarea abierta más próxima) y monto.
  - *Tablero:* **[v2]** **5 columnas = las 5 fases** (Prospección, Calificación, Solución, Comercial, Cierre). Cada tarjeta muestra su etapa exacta. **Sin arrastrar y soltar** en v1: mover de etapa se hace desde la ficha, donde viven las validaciones.
- **Ficha del lead:** progreso del embudo, panel de la etapa actual (datos o hito), registrar interacción, historial de interacciones, tareas y contactos de la empresa. Botones de editar, borrar, avanzar y **[v2]** retroceder de etapa.
- **Empresas:** lista de cuentas; el detalle muestra datos editables, sus proyectos, sus contactos y el historial de interacciones consolidado.
- **Contactos:** lista de personas; el contacto se gestiona dentro de su empresa.

CRUD completo en empresas, contactos, leads, tareas e interacciones.

**[v2] Borrado:** sigue siendo permanente y en cascada, pero el diálogo de confirmación **muestra el recuento real de lo que se va a destruir** ("se eliminarán 3 leads, 12 tareas y 24 interacciones") y **exige escribir el nombre del registro** para habilitar el botón. No hay archivado ni deshacer en v1.

### 8.1 [v2] Móvil

- La barra lateral se convierte en una **barra inferior de 5 iconos** en pantallas de teléfono.
- La tabla de Leads se convierte en **tarjetas apiladas**.
- El resto de las vistas es responsivo por diseño.

## 9. Diseño

- **Sistema de componentes:** shadcn/ui sobre Radix UI y Tailwind CSS **v4**. Los componentes se copian al proyecto.
- **Tipografía:** JetBrains Mono para títulos y todos los números; Inter para el cuerpo.
- **Color:** Primary `#2563EB`, Text `#020062`, Accent `#0025AE`, Border `#E2E8F0`, Surface `#FFFFFF`, Fondo `#F4F6FA`. **[v2]** Se cargan como **variables de tema de shadcn**; no se usa la paleta gris por defecto de shadcn.
- **Interfaz** en español (es-MX).
- **White-label:** sin logotipo de marca fijo en la interfaz.

## 10. Arquitectura

- **[v2] Aplicación:** Vite + React + **TypeScript**. Todo el código, front y back, en TypeScript, para que los tipos generados por Convex lleguen a la interfaz.
- **[v2] Ruteo:** React Router con URLs reales (`/leads/:id`, `/empresas/:id`). El botón "atrás" del teléfono funciona.
- **Estilos:** Tailwind CSS v4 mediante el plugin `@tailwindcss/vite`, más los componentes de shadcn/ui.
- **Backend:** Convex — base de datos en tiempo real. Cada entidad tiene su archivo de queries y mutations, dentro de la carpeta `convex/`. Todas las operaciones filtran por el usuario autenticado.
- **Autenticación:** Convex Auth nativo (correo + contraseña). **[v2] El registro público está deshabilitado**: la alta solo se ofrece mientras la tabla `users` está vacía, de modo que solo puede existir la primera cuenta. Después la pantalla solo permite iniciar sesión. No depende de ninguna variable de entorno. Cada registro lleva `userId`.
- **Sincronización:** en tiempo real entre dispositivos, nativa de Convex.
- **[v2] Despliegue:** **Cloudflare Pages**, conectado a un repositorio de GitHub. Al ser una SPA con React Router, se incluye un archivo `public/_redirects` con `/* /index.html 200`.

### 10.1 Tablas (Convex)

`empresas`, `contactos`, `iniciativas`, `tareas`, `interacciones`, **[v2]** `settings`, más las tablas de Convex Auth. Relaciones por referencia tipada (`v.id()`). Índices por usuario, por empresa, por iniciativa y por etapa.

### 10.2 Operaciones principales

- **empresas:** list, get, create, update, remove (cascada), **[v2]** `deletePreview` (recuento para el diálogo de confirmación).
- **contactos:** list, listByEmpresa, create, update, remove.
- **iniciativas:** list, listByEmpresa, get, create, update, updateData, advanceStage **[v2] (con validación de obligatorios)**, **[v2]** regressStage, marcarSalida, reabrir, remove (cascada), **[v2]** deletePreview.
- **tareas:** list, listByIniciativa, create, toggle, update, remove.
- **interacciones:** listByIniciativa, registrar (interacción + tarea nueva + avance en una transacción), remove.
- **[v2] settings:** get, update (tipo de cambio USD→MXN).

### 10.3 [v2] Plan de migración del prototipo

`mexillum-crm.jsx` (1579 líneas, estilos en línea, datos en memoria) se porta **pantalla por pantalla**. La aplicación queda funcionando después de cada paso. Orden:

1. Andamiaje: Vite + TS, Tailwind v4, shadcn, tema de color, `convex/`, git.
2. Login y capa de datos.
3. Shell de navegación + Leads (Tabla).
4. Leads (Tablero de 5 fases).
5. Ficha del lead (panel de etapa, registrar interacción, tareas).
6. Panel.
7. Empresas, Contactos, Acciones.
8. Móvil, diálogos de borrado, settings.

## 11. Decisiones cerradas

**De la v1**

- Alcance inicial: un solo usuario, multi-dispositivo, nube desde el día 1.
- Contactos a nivel empresa (compartidos entre proyectos).
- Una empresa puede tener varias iniciativas.
- Separación etapas-hito vs. etapas-con-datos.
- Obligatorios solo en montos críticos.
- Payback siempre derivado.
- Montos como número plano en USD (sin centavos en esta fase).
- `data` de la iniciativa como objeto anidado.
- Backend Convex; autenticación con Convex Auth nativo.
- UI con shadcn/ui (Radix + Tailwind).
- Interfaz white-label.

**[v2] De la sesión del 2026-08-21**

1. El prototipo se porta completo a Tailwind v4 + shadcn/ui, conservando los colores del PRD.
2. El port es pantalla por pantalla, con la app siempre ejecutable.
3. Todo el código en TypeScript.
4. `iniciativa.accion` se elimina; la próxima acción es la tarea abierta más próxima.
5. `tareas.fecha` es obligatoria.
6. Las sugerencias por etapa se vuelven plantillas de tarea de un clic.
7. El tipo de cambio USD→MXN vive en `settings`, editable en la app.
8. La validación de campos obligatorios vive en la mutation de Convex.
9. Se puede retroceder una etapa, con confirmación, sin borrar datos.
10. React Router con URLs reales; `_redirects` para Cloudflare.
11. Leads = una página con conmutador Tabla / Tablero.
12. El tablero tiene 5 columnas (fases), sin arrastrar y soltar.
13. Los leads cerrados se ocultan por defecto y nunca cuentan en KPIs.
14. Los `DEFERRED` reaparecen en el Panel el día de su `fechaRetomar`.
15. En teléfono: barra inferior de 5 iconos y tabla de leads en tarjetas.
16. El borrado es permanente, con recuento real y confirmación por escritura del nombre.
17. Convex Auth solo con contraseña; el alta solo existe mientras no hay ninguna cuenta y luego se cierra sola.
18. La base arranca vacía; los datos de demo viven en un script de seed.
19. Despliegue en Cloudflare Pages desde GitHub.

## 12. Decisiones abiertas / siguiente fase

- Plan/tier de Convex, a medir con consumo real.
- Posible migración futura a montos en centavos si la precisión lo exige.
- Multiusuario, roles y colaboración con ingeniería (fase posterior).
- Archivado / papelera con deshacer (hoy el borrado es permanente).
- Arrastrar y soltar en el tablero.
- Notificaciones y documentos adjuntos.

## 13. [v2] Tareas que dependen del usuario

Requieren cuentas personales; no las puede hacer el agente:

1. Crear un repositorio vacío en GitHub y entregar la URL.
2. Ejecutar `npx convex dev` una vez, para iniciar sesión en Convex y crear el despliegue.
3. Conectar ese repositorio a Cloudflare Pages.
