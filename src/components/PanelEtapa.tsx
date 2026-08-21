import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  STAGE_FIELDS,
  HITO_CRITERIO,
  stageDef,
  missingRequired,
  FIELD_LABELS,
} from "../../convex/stages";
import { CampoEtapa } from "@/components/CampoEtapa";
import { payback } from "@/lib/formato";

type DataLead = Doc<"iniciativas">["data"];

/**
 * Panel de la etapa actual (PRD §6.1).
 *  - Etapa-hito: no hay formulario; se cumple registrando la interacción.
 *  - Etapa-con-datos: campos del proyecto, con los obligatorios marcados.
 */
export function PanelEtapa({
  lead,
  usdMxn,
}: {
  lead: Doc<"iniciativas">;
  usdMxn: number;
}) {
  const updateData = useMutation(api.iniciativas.updateData);
  const def = stageDef(lead.stage);
  if (!def) return null;

  const campos = STAGE_FIELDS[lead.stage];
  const faltan = missingRequired(lead.stage, lead.data);

  if (def.kind === "hito" || !campos) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Flag className="size-3.5" />
          </span>
          <div>
            <h2 className="font-heading text-sm font-semibold text-foreground">
              {def.label}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Esta etapa es un hito: no tiene formulario.{" "}
              {HITO_CRITERIO[lead.stage]}
            </p>
          </div>
        </div>
      </section>
    );
  }

  async function guardar(key: string, valor: string | number | undefined) {
    try {
      await updateData({ id: lead._id, patch: { [key]: valor } as DataLead });
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar.");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        {def.label}
      </h2>

      {faltan.length > 0 && (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
          Falta para avanzar:{" "}
          {faltan.map((f) => FIELD_LABELS[f] ?? f).join(", ")}.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <div
            key={campo.key}
            className={campo.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            <CampoEtapa
              campo={campo}
              valor={
                campo.type === "computed"
                  ? undefined
                  : (lead.data as Record<string, string | number | undefined>)[
                      campo.key
                    ]
              }
              usdMxn={usdMxn}
              derivado={
                campo.key === "__payback"
                  ? payback(lead.data.capex, lead.data.ahorroAnual)
                  : null
              }
              onGuardar={(v) => void guardar(campo.key, v)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
