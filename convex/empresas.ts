import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getOwned } from "./lib";

// Lista todas las empresas del usuario, ordenadas por nombre.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("empresas")
      .withIndex("by_user_nombre", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Una empresa por id (validando propiedad). Null si no existe: un
// enlace viejo debe enseñar "ya no existe", no una página en blanco.
export const get = query({
  args: { id: v.id("empresas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const doc = await ctx.db.get(id);
    if (doc === null || doc.userId !== userId) return null;
    return doc;
  },
});

export const create = mutation({
  args: { nombre: v.string(), segmento: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await ctx.db.insert("empresas", { userId, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id("empresas"),
    nombre: v.optional(v.string()),
    segmento: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", id, userId);
    await ctx.db.patch(id, patch);
  },
});

// Cuenta exactamente lo que la cascada va a destruir (PRD §8).
// El diálogo de borrado muestra estos números y exige escribir el
// nombre de la empresa antes de habilitar el botón.
export const deletePreview = query({
  args: { id: v.id("empresas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    // Devolvemos null en vez de lanzar: tras borrar, el diálogo sigue
    // montado un instante y la query volvería a pedir el documento.
    if ((await ctx.db.get(id)) === null) return null;
    const empresa = await getOwned(ctx, "empresas", id, userId);

    const contactos = await ctx.db
      .query("contactos")
      .withIndex("by_empresa", (q) => q.eq("empresaId", id))
      .collect();
    const iniciativas = await ctx.db
      .query("iniciativas")
      .withIndex("by_empresa", (q) => q.eq("empresaId", id))
      .collect();

    let tareas = 0;
    let interacciones = 0;
    for (const ini of iniciativas) {
      tareas += (
        await ctx.db
          .query("tareas")
          .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", ini._id))
          .collect()
      ).length;
      interacciones += (
        await ctx.db
          .query("interacciones")
          .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", ini._id))
          .collect()
      ).length;
    }

    return {
      nombre: empresa.nombre,
      contactos: contactos.length,
      iniciativas: iniciativas.length,
      tareas,
      interacciones,
    };
  },
});

// Borra la empresa y en cascada sus contactos, iniciativas,
// y las tareas/interacciones de esas iniciativas.
export const remove = mutation({
  args: { id: v.id("empresas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "empresas", id, userId);

    const contactos = await ctx.db
      .query("contactos")
      .withIndex("by_empresa", (q) => q.eq("empresaId", id))
      .collect();
    for (const c of contactos) await ctx.db.delete(c._id);

    const iniciativas = await ctx.db
      .query("iniciativas")
      .withIndex("by_empresa", (q) => q.eq("empresaId", id))
      .collect();
    for (const ini of iniciativas) {
      const tareas = await ctx.db
        .query("tareas")
        .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", ini._id))
        .collect();
      for (const t of tareas) await ctx.db.delete(t._id);

      const ints = await ctx.db
        .query("interacciones")
        .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", ini._id))
        .collect();
      for (const n of ints) await ctx.db.delete(n._id);

      await ctx.db.delete(ini._id);
    }

    await ctx.db.delete(id);
  },
});
