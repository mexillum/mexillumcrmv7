import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id, TableNames } from "./_generated/dataModel";

/**
 * Devuelve el userId autenticado o lanza si no hay sesión.
 * Todas las queries/mutations lo usan para aislar los datos por usuario.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("No autenticado");
  }
  return userId;
}

/**
 * Carga un documento y verifica que pertenezca al usuario actual.
 * Evita que alguien lea/edite registros que no son suyos.
 */
export async function getOwned<T extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  table: T,
  id: Id<T>,
  userId: Id<"users">
) {
  const doc = await ctx.db.get(id);
  if (!doc) throw new Error("No encontrado");
  // Todas nuestras tablas de negocio llevan userId.
  if (doc.userId !== userId) throw new Error("No autorizado");
  return doc;
}
