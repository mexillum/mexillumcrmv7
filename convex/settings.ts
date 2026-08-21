import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib";

/** Valor por defecto si el usuario nunca lo tocó (PRD §4.2). */
export const USD_MXN_DEFAULT = 18.5;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    return { usdMxn: row?.usdMxn ?? USD_MXN_DEFAULT };
  },
});

/** Actualiza el tipo de cambio USD→MXN. Crea la fila la primera vez. */
export const update = mutation({
  args: { usdMxn: v.number() },
  handler: async (ctx, { usdMxn }) => {
    const userId = await requireUser(ctx);
    if (!Number.isFinite(usdMxn) || usdMxn <= 0) {
      throw new Error("El tipo de cambio debe ser un número mayor que cero.");
    }
    const row = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { usdMxn });
    } else {
      await ctx.db.insert("settings", { userId, usdMxn });
    }
  },
});
