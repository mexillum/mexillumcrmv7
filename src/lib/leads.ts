import type { Doc } from "../../convex/_generated/dataModel";
import { leadOculto } from "../../convex/stages";

export type Tarea = Doc<"tareas">;

/** Un lead más lo que las vistas necesitan saber de él. */
export type LeadVista = Doc<"iniciativas"> & {
  oculto: boolean;
  proxima?: Tarea;
};

/** Monto que representa mejor al lead, del más firme al más tentativo. */
export function montoDe(data: {
  montoFinal?: number;
  montoNegociado?: number;
  montoPropuesta?: number;
  capex?: number;
}): number | undefined {
  return (
    data.montoFinal ?? data.montoNegociado ?? data.montoPropuesta ?? data.capex
  );
}

/** Junta iniciativas, su próxima tarea y la regla de visibilidad. */
export function armarLeads(
  iniciativas: Doc<"iniciativas">[],
  proximas: Record<string, Tarea> | undefined,
  hoy: string
): LeadVista[] {
  return iniciativas.map((i) => ({
    ...i,
    oculto: leadOculto(i.salida, hoy),
    proxima: proximas?.[i._id],
  }));
}
