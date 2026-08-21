# PRD — CRM de pipeline comercial (energía SFV/BESS)

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

## 4. Modelo de datos

Cuatro entidades de negocio más las interacciones, en una jerarquía simple:

```
Empresa
 ├── Contactos        (personas de la empresa, compartidas entre sus proyectos)
 └── Iniciativas      (proyectos / leads; una empresa puede tener varios)
       ├── Tareas         (acciones / pendientes)
       └── Interacciones  (notas, llamadas, reuniones, correos)
```

Decisión clave: los **contactos cuelgan de la empresa, no de la iniciativa**. Si una empresa tiene tres proyectos, los mismos contactos sirven para los tres sin duplicarse.

### 4.1 Campos por entidad

**Empresa:** nombre, segmento.

**Contacto:** empresa, nombre, puesto, correo, teléfono.

**Iniciativa:** empresa, nombre del proyecto, etapa (1–11), fecha estimada de cierre, próxima acción, salida de pipeline (opcional), y un objeto `data` con los campos que se capturan por etapa (ver §6.1).

**Tarea:** iniciativa, título, fecha de vencimiento, completada (sí/no).

**Interacción:** iniciativa, tipo (Nota / Llamada / Reunión / Correo), fecha (sin hora), contacto (opcional), descripción.

### 4.2 Convenciones

- **Montos:** número plano en USD; cada monto USD muestra su equivalente aproximado en MXN a un tipo de cambio de referencia.
- **Payback:** siempre derivado (CAPEX ÷ ahorro anual), nunca escrito a mano; se muestra en años.
- **Dato desconocido:** se muestra como `—`, no se inventa.
- **Fechas:** formato `YYYY-MM-DD`.

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

- **Hito:** avanza registrando la interacción que la cumple; no tiene formulario de datos propio. Son las etapas 01, 03, 04, 08 y 10. Ejemplo: "Reunión agendada" no es un formulario, es el hito que se logra al registrar el correo o la llamada donde el cliente confirmó la cita.
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

**\*** Campo obligatorio: bloquea el avance de etapa si está vacío. El resto son sugeridos (se puede avanzar sin llenarlos). La validación de obligatorios vive en el front.

### 6.2 Salidas de pipeline

Una iniciativa puede salir del flujo por una de cuatro vías:

| Salida | Estado | Exige | Etapas normales |
|---|---|---|---|
| No califica | `NO_QUALIFY` | — | 01–04 |
| No viable | `NOT_VIABLE` | — | 05–07 |
| Perdido | `LOST` | Motivo; nota opcional | 03–10 |
| Retomar después | `DEFERRED` | Fecha para retomar | 01–10 |

Motivos de pérdida: Competencia, Precio, Sin presupuesto, Sin decisión, Otro.

Una salida fuera de su etapa normal se marca como excepcional y exige un reconocimiento explícito (`exceptionAcknowledged`); no amplía permisos. La etapa 11 no ofrece salidas. Una iniciativa con salida puede reabrirse (se elimina la salida).

## 7. Registrar interacción

El mecanismo central del seguimiento. Al registrar una interacción se capturan dos bloques:

**Qué pasó:** tipo (Nota / Llamada / Reunión / Correo), fecha, contacto (opcional), descripción.

**Qué sigue:** mantener la acción actual (por defecto) o definir una nueva, elegida de las sugerencias de la etapa o escrita a mano. En etapas-hito, un check permite avanzar de etapa con la misma interacción.

Todo (interacción + próxima acción + avance de etapa) se guarda en una sola operación.

Sugerencias de próxima acción por etapa:

| Etapa | Sugerencias |
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

- **Panel:** KPIs (leads abiertos, en fase comercial, acciones vencidas, próximas 7 días) y listas de acciones vencidas y próximas.
- **Leads:** tabla de iniciativas con empresa, proyecto, etapa, próxima acción y monto. Clic abre la ficha.
- **Ficha del lead:** progreso del embudo, panel de la etapa actual (datos o hito), registrar interacción, historial de interacciones, acciones/pendientes y contactos de la empresa. Botones de editar, borrar y avanzar de etapa.
- **Acciones:** todos los pendientes agrupados en vencidas / próximas / completadas.
- **Empresas:** lista de cuentas; el detalle muestra datos editables de la empresa, sus proyectos, sus contactos y el historial de interacciones consolidado.
- **Contactos:** lista de personas; el contacto se gestiona dentro de su empresa.

CRUD completo (crear, editar, borrar) en empresas, contactos, leads, tareas e interacciones. El borrado pide confirmación y es en cascada (borrar una empresa arrastra sus proyectos y contactos; borrar un lead arrastra sus tareas e interacciones).

## 9. Diseño

- **Sistema de componentes:** shadcn/ui — componentes accesibles construidos sobre Radix UI y estilizados con Tailwind CSS. Se copian al proyecto (no es una dependencia opaca), lo que permite ajustarlos a la marca y encaja con el principio de reducir dependencias de terceros.
- **Tipografía:** JetBrains Mono para títulos y todos los números; Inter para el cuerpo.
- **Color:** Primary `#2563EB`, Text `#020062`, Accent `#0025AE`, Border `#E2E8F0`, Surface `#FFFFFF`. Los colores de fase del embudo viven dentro de esa familia azul. Se expresan como tokens de tema de shadcn (variables CSS).
- **Interfaz** en español (es-MX).
- **White-label:** sin logotipo de marca fijo en la interfaz.

## 10. Arquitectura

- **Frontend:** React con shadcn/ui (Radix UI + Tailwind CSS) para los componentes de interfaz. Prototipo funcional con datos en memoria; a conectar al backend.
- **Backend:** Convex — base de datos en tiempo real. Cada entidad tiene su archivo de queries y mutations. Todas las operaciones filtran por el usuario autenticado.
- **Autenticación:** Convex Auth nativo (correo + contraseña), sin proveedores de terceros. Cada registro lleva `userId`, lo que aísla los datos y deja la puerta abierta a multiusuario sin migración.
- **Sincronización:** en tiempo real entre dispositivos, nativa de Convex.

### 10.1 Tablas (Convex)

`empresas`, `contactos`, `iniciativas`, `tareas`, `interacciones`, más las tablas de Convex Auth. Relaciones por referencia tipada (`v.id()`). Índices por usuario (listas), por empresa (detalle de empresa), por iniciativa (tareas e interacciones de una ficha) y por etapa (pipeline).

### 10.2 Operaciones principales

- **empresas:** list, get, create, update, remove (cascada).
- **contactos:** list, listByEmpresa, create, update, remove.
- **iniciativas:** list, listByEmpresa, get, create, update, updateData, advanceStage, marcarSalida, reabrir, remove (cascada).
- **tareas:** list, listByIniciativa, create, toggle, update, remove.
- **interacciones:** listByIniciativa, registrar (interacción + próxima acción + avance en una transacción), remove.

## 11. Decisiones cerradas

- Alcance inicial: un solo usuario, multi-dispositivo, nube desde el día 1.
- Contactos a nivel empresa (compartidos entre proyectos).
- Una empresa puede tener varias iniciativas.
- Separación etapas-hito vs. etapas-con-datos.
- Obligatorios solo en montos críticos; validación en el front.
- Payback siempre derivado.
- Montos como número plano en USD (sin centavos en esta fase).
- `data` de la iniciativa como objeto anidado.
- Backend Convex; autenticación con Convex Auth nativo.
- UI con shadcn/ui (Radix + Tailwind).
- Interfaz white-label.

## 12. Decisiones abiertas / siguiente fase

- Conectar el frontend al backend (reemplazar el estado en memoria por queries/mutations de Convex y montar la pantalla de login).
- Setup del proyecto Convex y despliegue.
- Plan/tier de Convex, a medir con consumo real.
- Posible migración futura a montos en centavos si la precisión lo exige.
- Multiusuario, roles y colaboración con ingeniería (fase posterior).
