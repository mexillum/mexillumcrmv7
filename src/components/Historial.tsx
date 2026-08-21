import { MessageSquare, Phone, Users, Mail, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { fmtFechaLarga } from "@/lib/formato";

const ICONO: Record<string, typeof MessageSquare> = {
  Nota: MessageSquare,
  Llamada: Phone,
  "Reunión": Users,
  Correo: Mail,
};

/** Historial de interacciones, de la más reciente a la más vieja. */
export function Historial({
  interacciones,
  nombreContacto,
}: {
  interacciones: (Doc<"interacciones"> & { iniciativaNombre?: string })[];
  nombreContacto: (id: string) => string | undefined;
}) {
  const borrar = useMutation(api.interacciones.remove);
  const ordenadas = [...interacciones].sort((a, b) =>
    a.fecha === b.fecha ? b._creationTime - a._creationTime : b.fecha.localeCompare(a.fecha)
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Historial
      </h2>

      {ordenadas.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground">
          Todavía no hay interacciones registradas.
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {ordenadas.map((n) => {
            const Icon = ICONO[n.tipo] ?? MessageSquare;
            const contacto = n.contactoId ? nombreContacto(n.contactoId) : undefined;
            return (
              <li key={n._id} className="group flex gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-semibold text-foreground">
                      {n.tipo}
                    </span>
                    <span className="font-heading text-xs tabular-nums text-muted-foreground">
                      {fmtFechaLarga(n.fecha)}
                    </span>
                    {contacto && (
                      <span className="text-xs text-muted-foreground">
                        · {contacto}
                      </span>
                    )}
                    {n.iniciativaNombre && (
                      <span className="text-xs text-muted-foreground">
                        · {n.iniciativaNombre}
                      </span>
                    )}
                    <button
                      type="button"
                      title="Borrar interacción"
                      onClick={() => {
                        if (!confirm("¿Borrar esta interacción? No se puede deshacer."))
                          return;
                        void borrar({ id: n._id });
                      }}
                      className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  {n.descripcion && (
                    <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted-foreground">
                      {n.descripcion}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
