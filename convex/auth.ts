import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Login con correo + contraseña, sin terceros.
 *
 * PRD §10 — EL REGISTRO PÚBLICO ESTÁ CERRADO. La app es de un solo
 * usuario y vive en una URL pública; con el alta abierta cualquiera
 * podría crearse una cuenta.
 *
 * La única excepción es el arranque: mientras NO exista ningún usuario,
 * se permite crear el primero (el tuyo). En cuanto existe, la puerta se
 * cierra sola y no hay que acordarse de cerrarla. No hay variables de
 * entorno que recordar.
 *
 * Si algún día pierdes el acceso: borra la fila de `users` desde el
 * dashboard de Convex y la pantalla volverá a ofrecer crear la cuenta.
 */

async function sePuedeRegistrar(ctx: MutationCtx): Promise<boolean> {
  const alguno = await ctx.db.query("users").first();
  return alguno === null;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Usuario ya existente: inicio de sesión normal, siempre permitido.
      if (args.existingUserId) return args.existingUserId;

      if (!(await sePuedeRegistrar(ctx))) {
        throw new Error("El registro está cerrado.");
      }

      return await ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name,
      });
    },
  },
});

/**
 * ¿La base todavía no tiene ninguna cuenta?
 * La pantalla de acceso la usa para mostrar "crear cuenta" la primera
 * vez y solo "entrar" siempre después.
 */
export const necesitaPrimeraCuenta = query({
  args: {},
  handler: async (ctx) => {
    const alguno = await ctx.db.query("users").first();
    return alguno === null;
  },
});

/** El usuario de la sesión actual, o null si no hay sesión. */
export const yo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user ? { _id: user._id, email: user.email ?? null } : null;
  },
});
