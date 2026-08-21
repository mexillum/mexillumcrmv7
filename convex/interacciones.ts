import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getOwned } from "./lib";
import { missingRequired, FIELD_LABELS } from "./stages";

export const listByIniciativa = query({
  args: { iniciativaId: v.id("iniciativas") },
  handler: async (ctx, { iniciativaId }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "iniciativas", iniciativaId, userId);
    return await ctx.db
      .query("interacciones")
      .withIndex("by_iniciativa", (q) => q.eq("iniciativaId", iniciativaId))
      .collect();
  },
});

/**
 * Registra una interacción y, en el mismo gesto (como en la ficha):
 *  - opcionalmente crea la próxima TAREA (título + fecha obligatoria)
 *  - opcionalmente avanza una etapa (solo etapas-hito)
 * Todo en una sola mutation = una sola transacción.
 *
 * PRD §4.3: ya no existe un campo de texto "próxima acción". Lo que
 * sigue siempre es una tarea con fecha, que es lo que el Panel puede
 * marcar como vencida.
 */
export const registrar = mutation({
  args: {
    iniciativaId: v.id("iniciativas"),
    tipo: v.string(),
    fecha: v.string(),
    contactoId: v.optional(v.id("contactos")),
    descripcion: v.optional(v.string()),
    avanzar: v.optional(v.boolean()),
    nuevaTarea: v.optional(
      v.object({ titulo: v.string(), fecha: v.string() })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const ini = await getOwned(ctx, "iniciativas", args.iniciativaId, userId);
    if (args.contactoId) await getOwned(ctx, "contactos", args.contactoId, userId);

    const id = await ctx.db.insert("interacciones", {
      userId,
      iniciativaId: args.iniciativaId,
      tipo: args.tipo,
      fecha: args.fecha,
      contactoId: args.contactoId,
      descripcion: args.descripcion,
    });

    if (args.nuevaTarea) {
      await ctx.db.insert("tareas", {
        userId,
        iniciativaId: args.iniciativaId,
        titulo: args.nuevaTarea.titulo,
        fecha: args.nuevaTarea.fecha,
        done: false,
      });
    }

    if (args.avanzar) {
      // Mismas reglas que iniciativas.advanceStage: la validación no
      // se salta por entrar por esta puerta.
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
      await ctx.db.patch(args.iniciativaId, { stage: ini.stage + 1 });
    }

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("interacciones") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    await getOwned(ctx, "interacciones", id, userId);
    await ctx.db.delete(id);
  },
});
