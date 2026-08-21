import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Pantalla de acceso. PRD §10: solo inicio de sesión.
 * No hay alta de cuenta — el registro público está deshabilitado
 * en el servidor, así que ni siquiera se ofrece aquí.
 */
export function Login() {
  const { signIn } = useAuthActions();
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setEnviando(true);
    try {
      await signIn("password", {
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        flow: "signIn",
      });
    } catch {
      // Convex Auth no distingue correo inexistente de contraseña mala,
      // a propósito: decirlo filtraría qué cuentas existen.
      toast.error("Correo o contraseña incorrectos.");
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Acceso privado. El registro está cerrado.
        </p>
      </div>
    </div>
  );
}
