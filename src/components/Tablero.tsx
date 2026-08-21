import { PHASES, stageDef, type Phase } from "../../convex/stages";
import { LeadCard } from "@/components/LeadCard";
import type { LeadVista } from "@/lib/leads";
import { cn } from "@/lib/utils";

/** Barra de color de cada fase, con los tokens del tema (PRD §9). */
const PHASE_BAR: Record<Phase, string> = {
  "Prospección": "bg-phase-prospeccion",
  "Calificación": "bg-phase-calificacion",
  "Solución": "bg-phase-solucion",
  "Comercial": "bg-phase-comercial",
  "Cierre": "bg-phase-cierre",
};

/**
 * PRD §8: tablero de CINCO columnas, una por fase — no de once, que no
 * cabrían en un teléfono ni cómodamente en un portátil.
 *
 * Sin arrastrar y soltar a propósito: mover de etapa exige validar los
 * campos obligatorios, y eso vive en la ficha del lead.
 */
export function Tablero({
  leads,
  nombreEmpresa,
  hoy,
}: {
  leads: LeadVista[];
  nombreEmpresa: (id: string) => string;
  hoy: string;
}) {
  const porFase = new Map<Phase, LeadVista[]>(PHASES.map((f) => [f, []]));
  for (const lead of leads) {
    const fase = stageDef(lead.stage)?.phase;
    if (fase) porFase.get(fase)!.push(lead);
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div className="flex min-w-max gap-3 md:grid md:min-w-0 md:grid-cols-5">
        {PHASES.map((fase) => {
          const enFase = porFase.get(fase)!;
          return (
            <section
              key={fase}
              className="flex w-64 shrink-0 flex-col md:w-auto"
            >
              <header className="mb-2.5">
                <div className={cn("h-1 rounded-full", PHASE_BAR[fase])} />
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h2 className="text-[13px] font-semibold text-foreground">
                    {fase}
                  </h2>
                  <span className="font-heading text-xs tabular-nums text-muted-foreground">
                    {enFase.length}
                  </span>
                </div>
              </header>

              <div className="flex flex-col gap-2">
                {enFase.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Vacía
                  </p>
                ) : (
                  enFase.map((lead) => (
                    <LeadCard
                      key={lead._id}
                      lead={lead}
                      empresa={nombreEmpresa(lead.empresaId)}
                      hoy={hoy}
                      compacta
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
