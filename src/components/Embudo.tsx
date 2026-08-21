import { STAGES, stageDef, type Phase } from "../../convex/stages";
import { cn } from "@/lib/utils";

const PHASE_BG: Record<Phase, string> = {
  "Prospección": "bg-phase-prospeccion",
  "Calificación": "bg-phase-calificacion",
  "Solución": "bg-phase-solucion",
  "Comercial": "bg-phase-comercial",
  "Cierre": "bg-phase-cierre",
};

/**
 * Progreso del embudo: las once etapas de un vistazo (PRD §8).
 * Las pasadas van llenas, la actual marcada, las futuras en gris.
 */
export function Embudo({ stage, cerrado }: { stage: number; cerrado: boolean }) {
  const actual = stageDef(stage);

  return (
    <div>
      <div className="flex items-center gap-1">
        {STAGES.map((s) => {
          const pasada = s.id < stage;
          const esActual = s.id === stage;
          return (
            <div
              key={s.id}
              title={`${String(s.id).padStart(2, "0")} · ${s.label}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                cerrado
                  ? "bg-border"
                  : pasada || esActual
                    ? PHASE_BG[s.phase]
                    : "bg-border",
                esActual && !cerrado && "ring-2 ring-offset-2 ring-offset-card",
                esActual && !cerrado && "ring-current"
              )}
            />
          );
        })}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-heading tabular-nums">
            {String(stage).padStart(2, "0")}
          </span>{" "}
          de <span className="font-heading tabular-nums">11</span> ·{" "}
          {actual?.phase}
        </p>
        <p className="text-[13px] font-medium text-foreground">{actual?.label}</p>
      </div>
    </div>
  );
}
