import { stageDef, SALIDA_LABEL, type Salida } from "../../convex/stages";
import { cn } from "@/lib/utils";

/** Color de cada fase del embudo, como token del tema (PRD §9). */
const PHASE_CLASS: Record<string, string> = {
  "Prospección": "text-phase-prospeccion",
  "Calificación": "text-phase-calificacion",
  "Solución": "text-phase-solucion",
  "Comercial": "text-phase-comercial",
  "Cierre": "text-phase-cierre",
};

export function StagePill({ stage, className }: { stage: number; className?: string }) {
  const def = stageDef(stage);
  if (!def) return null;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5",
        PHASE_CLASS[def.phase],
        className
      )}
    >
      <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-current" />
      <span className="shrink-0 font-heading text-xs tabular-nums opacity-70">
        {String(def.id).padStart(2, "0")}
      </span>
      <span className="text-[13px] font-medium text-foreground">{def.label}</span>
    </span>
  );
}

export function SalidaBadge({ salida }: { salida: Salida }) {
  const esPerdido = salida.estado === "LOST";
  const esDiferido = salida.estado === "DEFERRED";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium",
        esPerdido && "bg-destructive-soft text-destructive",
        esDiferido && "bg-warn-soft text-warn",
        !esPerdido && !esDiferido && "bg-muted text-muted-foreground"
      )}
    >
      {SALIDA_LABEL[salida.estado] ?? salida.estado}
      {salida.motivo && (
        <span className="opacity-70">· {salida.motivo}</span>
      )}
    </span>
  );
}
