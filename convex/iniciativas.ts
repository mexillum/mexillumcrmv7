import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getOwned } from "./lib";
import { missingRequired, FIELD_LABELS } from "./stages";

const dataValidator = v.object({
  segmento: v.optional(v.string()),
  generador: v.optional(v.string()),
  tipoSistema: v.optional(v.string()),
  hipotesisValor: v.optional(v.string()),
  recibosCFE: v.optional(v.string()),
  tarifa: v.optional(v.string()),
  consumoMensual: v.optional(v.number()),
  perfilCarga: v.optional(v.string()),
  capex: v.optional(v.number()),
  ahorroAnual: v.optional(v.number()),
  capacidad: v.optional(v.string()),
  montoPropuesta: v.optional(v.number()),
  notasPropuesta: v.optional(v.string()),
  montoNegociado: v.optional(v.number()),
  objeciones: v.optional(v.string()),
  fechaFirma: v.optional(v.string()),
  montoFinal: v.optional(v.number()),
});

const salidaValidator = v.object({
  estado: v.string(),
  motivo: v.optional(v.string()),
  nota: v.optional(v.string()),
  fechaRetomar: v.optional(v.string()),
  exceptionAcknowledged: v.optional(v.boolean()),
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("iniciativas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByEmpresa = query({
  args: { empresaId: v.id("empresas") },
  handler: async (ctx, { empresaId }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", empresaId, userId);
    return await ctx.db
      .query("iniciativas")
      .withIndex("by_empresa", (q) => q.eq("empresaId", empresaId))
      .collect();
  },
});

// Devuelve null si el lead no existe, en vez de lanzar: un enlace
// viejo (un marcador, o un lead borrado desde otro dispositivo) debe
// enseñar "ya no existe", no una página en blanco.
export const get = query({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db.get(id);
    if (doc === null || doc.userId !== userId) return null;
    return doc;
  },
});

// Crea un lead en etapa 1 con data vacía.
export const create = mutation({
  args: {
    empresaId: v.id("empresas"),
    nombre: v.string(),
    cierre: v.optional(v.string()),
  },
  handler: async (ctx, { empresaId, nombre, cierre }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", empresaId, userId);
    return await ctx.db.insert("iniciativas", {
      userId,
      empresaId,
      nombre,
      cierre,
      stage: 1,
      data: {},
    });
  },
});

// Edita campos base del lead (nombre, empresa, cierre, próxima acción).
export const update = mutation({
  args: {
    id: v.id("iniciativas"),
    nombre: v.optional(v.string()),
    empresaId: v.optional(v.id("empresas")),
    cierre: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", id, userId);
    if (patch.empresaId) await getOwned(ctx, "empresas", patch.empresaId, userId);
    await ctx.db.patch(id, patch);
  },
});

// Fusiona parcialmente el objeto `data` (campos por etapa).
export const updateData = mutation({
  args: { id: v.id("iniciativas"), patch: dataValidator },
  handler: async (ctx, { id, patch }) => {
    const userId = await requireUser(ctx);
    const ini = await getOwned(ctx, "iniciativas", id, userId);
    await ctx.db.patch(id, { data: { ...ini.data, ...patch } });
  },
});

// Avanza una etapa. PRD §6.1: la validación de campos obligatorios
// vive AQUÍ, no solo en el formulario. Un bug de UI no puede saltársela.
export const advanceStage = mutation({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const ini = await getOwned(ctx, "iniciativas", id, userId);

    if (ini.salida) {
      throw new Error("El lead tiene una salida de pipeline. Reábrelo antes de avanzar.");
    }
    if (ini.stage >= 11) {
      throw new Error("El lead ya está en la última etapa.");
    }

    const faltan = missingRequired(ini.stage, ini.data);
    if (faltan.length > 0) {
      const nombres = faltan.map((f) => FIELD_LABELS[f] ?? f).join(", ");
      throw new Error(`Faltan campos obligatorios de la etapa actual: ${nombres}`);
    }

    await ctx.db.patch(id, { stage: ini.stage + 1 });
  },
});

// Retrocede una etapa (PRD §6.2). Existe para corregir un clic
// equivocado. NO borra los datos ya capturados. La interfaz pide
// confirmación antes de llamar.
export const regressStage = mutation({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const ini = await getOwned(ctx, "iniciativas", id, userId);
    if (ini.stage <= 1) {
      throw new Error("El lead ya está en la primera etapa.");
    }
    await ctx.db.patch(id, { stage: ini.stage - 1 });
  },
});

// Marca una salida de pipeline (NO_QUALIFY, NOT_VIABLE, LOST, DEFERRED).
export const marcarSalida = mutation({
  args: { id: v.id("iniciativas"), salida: salidaValidator },
  handler: async (ctx, { id, salida }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", id, userId);
    await ctx.db.patch(id, { salida });
  },
});

// Reabre un lead: quita la salida.
export const reabrir = mutation({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", id, userId);
    await ctx.db.patch(id, { salida: undefined });
  },
});

// Cuenta lo que se destruiría (PRD §8). El diálogo de borrado
// muestra estos números antes de dejar confirmar.
export const deletePreview = query({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    if ((await ctx.db.get(id)) === null) return null;
    const ini = await getOwned(ctx, "iniciativas", id, userId);
    const tareas = await ctx.db
      .query("tareas")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", id))
      .collect();
    const ints = await ctx.db
      .query("interacciones")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", id))
      .collect();
    return { nombre: ini.nombre, tareas: tareas.length, interacciones: ints.length };
  },
});

// Borra el lead con sus tareas e interacciones.
export const remove = mutation({
  args: { id: v.id("iniciativas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", id, userId);

    const tareas = await ctx.db
      .query("tareas")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", id))
      .collect();
    for (const t of tareas) await ctx.db.delete(t._id);

    const ints = await ctx.db
      .query("interacciones")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", id))
      .collect();
    for (const n of ints) await ctx.db.delete(n._id);

    await ctx.db.delete(id);
  },
});
