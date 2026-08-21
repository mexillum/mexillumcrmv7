import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Pantalla de acceso. PRD §10: el registro público está cerrado.
 *
 * Única excepción: si la base todavía no tiene ninguna cuenta, esta
 * pantalla ofrece crear la primera (la tuya). En cuanto existe, vuelve
 * a ser solo "entrar", para siempre.
 */
export function Login() {
  const { signIn } = useAuthActions();
  const primeraVez = useQuery(api.auth.necesitaPrimeraCuenta);
  const [enviando, setEnviando] = useState(false);

  // Mientras no sepamos si hay cuenta, no enseñamos el formulario
  // equivocado.
  const cargando = primeraVez === undefined;
  const registro = primeraVez === true;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    if (registro && password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      await signIn("password", {
        email: String(form.get("email") ?? "").trim(),
        password,
        flow: registro ? "signUp" : "signIn",
      });
    } catch {
      toast.error(
        registro
          ? "No se pudo crear la cuenta."
          : // No distinguimos correo inexistente de contraseña mala:
            // decirlo filtraría qué cuentas existen.
            "Correo o contraseña incorrectos."
      );
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <header className="mb-8">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            CRM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline comercial
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          {registro && (
            <div className="mb-6 rounded-lg bg-secondary p-3">
              <p className="font-heading text-sm font-medium text-secondary-foreground">
                Crea tu cuenta
              </p>
              <p className="mt-1 text-xs text-secondary-foreground/80">
                Es la primera y única. Después de esto, el registro se
                cierra solo.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                autoFocus
                placeholder="tu@correo.mx"
                disabled={cargando}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={registro ? "new-password" : "current-password"}
                required
                minLength={registro ? 8 : undefined}
                disabled={cargando}
              />
              {registro && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 8 caracteres.
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={enviando || cargando}
          >
            {cargando
              ? "…"
              : enviando
                ? registro
                  ? "Creando…"
                  : "Entrando…"
                : registro
                  ? "Crear cuenta"
                  : "Entrar"}
          </Button>
        </form>

        {!registro && !cargando && (
          <p className="mt-6 text-xs text-muted-foreground">
            Acceso privado. El registro está cerrado.
          </p>
        )}
      </div>
    </div>
  );
}
