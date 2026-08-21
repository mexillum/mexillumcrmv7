import { useNavigate } from "react-router-dom";
import { StagePill, SalidaBadge } from "@/components/StagePill";
import { ProximaAccion } from "@/components/ProximaAccion";
import { fmtUSD } from "@/lib/formato";
import { montoDe, type LeadVista } from "@/lib/leads";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de lead. La usan la lista de teléfono y el tablero, para que
 * un lead se vea igual en los dos sitios.
 */
export function LeadCard({
  lead,
  empresa,
  hoy,
  compacta = false,
}: {
  lead: LeadVista;
  empresa: string;
  hoy: string;
  compacta?: boolean;
}) {
  const navigate = useNavigate();
  const tarea = lead.proxima;
  const monto = montoDe(lead.data);

  return (
    <button
      type="button"
      onClick={() => navigate(`/leads/${lead._id}`)}
      className={cn(
        "w-full rounded-xl border border-border bg-card text-left transition-colors hover:bg-muted/40 active:bg-muted/60",
        compacta ? "p-3" : "p-4",
        lead.oculto && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* En el tablero la columna es estrecha: el nombre parte en dos
              líneas antes que recortarse a "Cement…". */}
          <p
            className={cn(
              "font-semibold text-foreground",
              compacta ? "line-clamp-2" : "truncate"
            )}
          >
            {empresa}
          </p>
          <p className="truncate text-sm text-muted-foreground">{lead.nombre}</p>
        </div>
        {!compacta && (
          <span className="shrink-0 font-heading text-sm tabular-nums text-foreground">
            {fmtUSD(montoDe(lead.data))}
          </span>
        )}
      </div>

      <div className={compacta ? "mt-2.5" : "mt-3"}>
        {lead.salida ? (
          <SalidaBadge salida={lead.salida} />
        ) : (
          <StagePill stage={lead.stage} />
        )}
      </div>

      <div className="mt-2 text-[13px]">
        <ProximaAccion tarea={tarea} hoy={hoy} />
      </div>

      {compacta && monto != null && (
        <p className="mt-2 border-t border-border pt-2 text-right font-heading text-sm tabular-nums text-foreground">
          {fmtUSD(monto)}
        </p>
      )}
    </button>
  );
}
