import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

/**
 * Login con correo + contraseña, sin terceros.
 *
 * PRD §10 — EL REGISTRO PÚBLICO ESTÁ DESHABILITADO. La app es de un
 * solo usuario y vive en una URL pública; si el alta estuviera abierta,
 * cualquiera podría crearse una cuenta. `createAccount` de abajo lanza
 * salvo que `ALLOW_SIGNUP` esté puesto en el entorno de Convex.
 *
 * Para crear tu cuenta la primera vez:
 *   npx convex env set ALLOW_SIGNUP true
 *   (te registras una vez desde la app)
 *   npx convex env remove ALLOW_SIGNUP
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Usuario ya existente: login normal, siempre permitido.
      if (args.existingUserId) return args.existingUserId;

      if (process.env.ALLOW_SIGNUP !== "true") {
        throw new Error("El registro está deshabilitado.");
      }

      return await ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name,
      });
    },
  },
});
