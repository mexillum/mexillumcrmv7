import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Tablas que Convex Auth necesita (users, sessions, etc.)
  ...authTables,

  // ── Configuración del usuario (PRD §4.1) ─────────────
  // Un registro por usuario. Hoy solo guarda el tipo de cambio.
  settings: defineTable({
    userId: v.id("users"),
    usdMxn: v.number(),
  }).index("by_user", ["userId"]),

  // ── Empresas (raíz) ──────────────────────────────────
  empresas: defineTable({
    userId: v.id("users"),
    nombre: v.string(),
    segmento: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_nombre", ["userId", "nombre"]),

  // ── Contactos (pertenecen a una empresa) ─────────────
  contactos: defineTable({
    userId: v.id("users"),
    empresaId: v.id("empresas"),
    nombre: v.string(),
    puesto: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_empresa", ["empresaId"]),

  // ── Iniciativas / leads (pertenecen a una empresa) ───
  // PRD §4.3: ya no existe el campo `accion`. La próxima acción
  // es la tarea abierta con la fecha de vencimiento más próxima.
  iniciativas: defineTable({
    userId: v.id("users"),
    empresaId: v.id("empresas"),
    nombre: v.string(),
    stage: v.number(), // 1–11
    cierre: v.optional(v.string()),
    salida: v.optional(
      v.object({
        estado: v.string(), // NO_QUALIFY | NOT_VIABLE | LOST | DEFERRED
        motivo: v.optional(v.string()),
        nota: v.optional(v.string()),
        fechaRetomar: v.optional(v.string()),
        exceptionAcknowledged: v.optional(v.boolean()),
      })
    ),
    data: v.object({
      segmento: v.optional(v.string()),
      generador: v.optional(v.string()),
      tipoSistema: v.optional(v.string()),
      hipotesisValor: v.optional(v.string()),
      recibosCFE: v.optional(v.string()),
      tarifa: v.optional(v.string()),
      consumoMensual: v.optional(v.number()),
      perfilCarga: v.optional(v.string()),
      capex: v.optional(v.number()), // USD (número plano)
      ahorroAnual: v.optional(v.number()),
      capacidad: v.optional(v.string()),
      montoPropuesta: v.optional(v.number()),
      notasPropuesta: v.optional(v.string()),
      montoNegociado: v.optional(v.number()),
      objeciones: v.optional(v.string()),
      fechaFirma: v.optional(v.string()),
      montoFinal: v.optional(v.number()),
    }),
  })
    .index("by_user", ["userId"])
    .index("by_empresa", ["empresaId"])
    .index("by_user_stage", ["userId", "stage"]),

  // ── Tareas / acciones (pertenecen a una iniciativa) ──
  // PRD §4.3: `fecha` es OBLIGATORIA. Sin fecha no hay vencimiento
  // y el KPI de "acciones vencidas" no puede existir.
  tareas: defineTable({
    userId: v.id("users"),
    iniciativaId: v.id("iniciativas"),
    titulo: v.string(),
    fecha: v.string(), // "YYYY-MM-DD" — obligatoria
    done: v.boolean(),
    // Contactos de la empresa a los que va dirigida la acción. Opcional:
    // muchas acciones no apuntan a nadie en concreto.
    contactoIds: v.optional(v.array(v.id("contactos"))),
    // Campo viejo (un solo contacto). Se conserva para no perder los
    // datos ya guardados; al leer se fusiona con contactoIds. Las
    // escrituras nuevas usan solo contactoIds.
    contactoId: v.optional(v.id("contactos")),
  })
    .index("by_user", ["userId"])
    .index("by_iniciativa", ["iniciativaId"])
    .index("by_user_done", ["userId", "done"])
    // Para "la tarea abierta más próxima" y para el Panel.
    .index("by_user_done_fecha", ["userId", "done", "fecha"])
    .index("by_iniciativa_done", ["iniciativaId", "done"]),

  // ── Interacciones (pertenecen a una iniciativa) ──────
  interacciones: defineTable({
    userId: v.id("users"),
    iniciativaId: v.id("iniciativas"),
    tipo: v.string(), // Nota | Llamada | Reunión | Correo
    fecha: v.string(), // "YYYY-MM-DD" (sin hora)
    contactoId: v.optional(v.id("contactos")),
    descripcion: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_iniciativa", ["iniciativaId"]),
});
