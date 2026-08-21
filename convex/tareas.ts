import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getOwned } from "./lib";

// Todas las tareas del usuario (el panel de Acciones las agrupa por estado).
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("tareas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listByIniciativa = query({
  args: { iniciativaId: v.id("iniciativas") },
  handler: async (ctx, { iniciativaId }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", iniciativaId, userId);
    return await ctx.db
      .query("tareas")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", iniciativaId))
      .collect();
  },
});

export const create = mutation({
  args: {
    iniciativaId: v.id("iniciativas"),
    titulo: v.string(),
    fecha: v.string(), // PRD §4.3: obligatoria
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", args.iniciativaId, userId);
    return await ctx.db.insert("tareas", { userId, done: false, ...args });
  },
});

export const toggle = mutation({
  args: { id: v.id("tareas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const t = await getOwned(ctx, "tareas", id, userId);
    await ctx.db.patch(id, { done: !t.done });
  },
});

export const update = mutation({
  args: {
    id: v.id("tareas"),
    titulo: v.optional(v.string()),
    fecha: v.optional(v.string()), // opcional aquí = "no cambiar"
    done: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "tareas", id, userId);
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("tareas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "tareas", id, userId);
    await ctx.db.delete(id);
  },
});

/**
 * PRD §4.3 — la "próxima acción" de cada lead es su tarea abierta con
 * la fecha más próxima. Devuelve un mapa iniciativaId -> tarea, para
 * que la tabla y el tablero de Leads no consulten una por una.
 */
export const proximasAcciones = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const abiertas = await ctx.db
      .query("tareas")
      .withIndex("by_user_done_fecha", (q) => q.eq("userId", userId).eq("done", false))
      .collect();

    // El índice ya las entrega por fecha ascendente: la primera de cada
    // iniciativa es la más próxima.
    const porIniciativa: Record<string, (typeof abiertas)[number]> = {};
    for (const t of abiertas) {
      if (!porIniciativa[t.iniciativaId]) porIniciativa[t.iniciativaId] = t;
    }
    return porIniciativa;
  },
});
