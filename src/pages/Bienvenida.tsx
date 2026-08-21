import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

/**
 * Marcador de posición del paso 2. Existe para que "sesión iniciada"
 * se vea claramente distinto de "algo falló". El shell de navegación
 * lo reemplaza en el paso 3.
 */
export function Bienvenida() {
  const { signOut } = useAuthActions();
  const yo = useQuery(api.auth.yo);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-heading text-lg font-semibold text-foreground">
            Sesión iniciada
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {yo?.email ?? "Cargando tu cuenta…"}
          </p>

          <p className="mt-4 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground">
            El acceso funciona. La navegación y la tabla de Leads llegan en
            el siguiente paso.
          </p>

          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => void signOut()}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
