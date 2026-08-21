import { fmtFecha, VACIO } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * PRD §4.3: la próxima acción de un lead es su tarea abierta con la
 * fecha más próxima. Sin tarea abierta, raya.
 */
export function ProximaAccion({
  tarea,
  hoy,
}: {
  tarea?: { titulo: string; fecha: string };
  hoy: string;
}) {
  if (!tarea) return <span className="text-muted-foreground">{VACIO}</span>;

  const vencida = tarea.fecha < hoy;

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className="text-muted-foreground">{tarea.titulo}</span>
      <span
        className={cn(
          "font-heading text-xs tabular-nums",
          vencida ? "font-semibold text-destructive" : "text-muted-foreground"
        )}
      >
        {fmtFecha(tarea.fecha)}
      </span>
    </span>
  );
}
