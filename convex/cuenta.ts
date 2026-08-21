"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { modifyAccountCredentials } from "@convex-dev/auth/server";

/**
 * Cambia la contraseña de una cuenta existente, sin borrar nada.
 *
 * Úsalo si pierdes el acceso o si la contraseña quedó guardada distinta
 * de lo que creías:
 *
 *   npx convex run cuenta:cambiarContrasena '{"email":"tu@correo.mx","nueva":"tu-nueva-contrasena"}'
 *
 * Es una función interna: no se puede llamar desde el navegador, solo
 * desde la línea de comandos con tus credenciales de Convex.
 */
export const cambiarContrasena = internalAction({
  args: { email: v.string(), nueva: v.string() },
  handler: async (ctx, { email, nueva }) => {
    if (nueva.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: nueva },
    });
    return `Contraseña actualizada para ${email}.`;
  },
});
