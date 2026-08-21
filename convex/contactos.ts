import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getOwned } from "./lib";

// Todos los contactos del usuario.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("contactos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Contactos de una empresa (usados en el detalle de empresa y en la ficha del lead).
export const listByEmpresa = query({
  args: { empresaId: v.id("empresas") },
  handler: async (ctx, { empresaId }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", empresaId, userId);
    return await ctx.db
      .query("contactos")
      .withIndex("by_empresa", (q) => q.eq("empresaId", empresaId))
      .collect();
  },
});

export const create = mutation({
  args: {
    empresaId: v.id("empresas"),
    nombre: v.string(),
    puesto: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", args.empresaId, userId);
    return await ctx.db.insert("contactos", { userId, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id("contactos"),
    empresaId: v.optional(v.id("empresas")),
    nombre: v.optional(v.string()),
    puesto: v.optional(v.string()),
    email: v.optional(v.string()),
    tel: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "contactos", id, userId);
    if (patch.empresaId) await getOwned(ctx, "empresas", patch.empresaId, userId);
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("contactos") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "contactos", id, userId);
    await ctx.db.delete(id);
  },
});
