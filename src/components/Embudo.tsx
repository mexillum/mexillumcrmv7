import { STAGES, stageDef, type Phase } from "../../convex/stages";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Color base de cada fase (variable CSS definida en index.css). */
const PHASE_VAR: Record<Phase, string> = {
  "Prospección": "--phase-prospeccion",
  "Calificación": "--phase-calificacion",
  "Solución": "--phase-solucion",
  "Comercial": "--phase-comercial",
  "Cierre": "--phase-cierre",
};

/**
 * Posición de cada etapa dentro de su fase: {i, n}. Se usa para dar a
 * cada sub-etapa un tono distinto del color de su fase (la primera más
 * clara, la última a color pleno). Se calcula una vez: STAGES es fijo.
 */
const POS = (() => {
  const conteo: Record<string, number> = {};
  for (const s of STAGES) conteo[s.phase] = (conteo[s.phase] ?? 0) + 1;
  const visto: Record<string, number> = {};
  const mapa = new Map<number, { i: number; n: number }>();
  for (const s of STAGES) {
    const i = visto[s.phase] ?? 0;
    visto[s.phase] = i + 1;
    mapa.set(s.id, { i, n: conteo[s.phase] });
  }
  return mapa;
})();

/** Tono de una etapa: mezcla el color de la fase con blanco. La primera
 *  etapa de la fase es la más clara; la última, a color pleno. */
function colorEtapa(phase: Phase, id: number): string {
  const { i, n } = POS.get(id) ?? { i: 0, n: 1 };
  const pct = n <= 1 ? 100 : 100 - (28 * (n - 1 - i)) / (n - 1);
  return `color-mix(in oklab, var(${PHASE_VAR[phase]}) ${pct}%, white)`;
}

/**
 * Progreso del embudo: las once etapas de un vistazo (PRD §8).
 * Cada fase tiene su color y cada sub-etapa un tono de ese color. Las
 * etapas ya alcanzadas van a color pleno; las futuras, atenuadas.
 */
export function Embudo({ stage, cerrado }: { stage: number; cerrado: boolean }) {
  const actual = stageDef(stage);

  return (
    <div>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {STAGES.map((s) => {
            const alcanzada = s.id <= stage;
            const esActual = s.id === stage;
            return (
              <Tooltip key={s.id}>
                <TooltipTrigger
                  render={
                    <div
                      style={
                        cerrado
                          ? undefined
                          : {
                              backgroundColor: colorEtapa(s.phase, s.id),
                              opacity: alcanzada ? 1 : 0.35,
                            }
                      }
                      className={cn(
                        "h-1.5 flex-1 cursor-default rounded-full transition-[opacity,background-color]",
                        cerrado && "bg-border",
                        esActual &&
                          !cerrado &&
                          "ring-2 ring-offset-2 ring-offset-card ring-current"
                      )}
                    />
                  }
                />
                <TooltipContent>
                  <p className="font-heading text-[11px] text-muted-foreground">
                    {String(s.id).padStart(2, "0")} · {s.phase}
                  </p>
                  <p className="font-medium text-foreground">{s.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

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
