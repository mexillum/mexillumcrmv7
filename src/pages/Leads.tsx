import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { leadOculto } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { StagePill, SalidaBadge } from "@/components/StagePill";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtUSD, fmtFecha, hoyISO, VACIO } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Filtro = "abiertos" | "cerrados" | "todos";

export function Leads() {
  const navigate = useNavigate();
  const hoy = hoyISO();

  const iniciativas = useQuery(api.iniciativas.list);
  const empresas = useQuery(api.empresas.list);
  const proximas = useQuery(api.tareas.proximasAcciones);

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("abiertos");

  const nombreEmpresa = useMemo(() => {
    const mapa = new Map((empresas ?? []).map((e) => [e._id, e.nombre]));
    return (id: string) => mapa.get(id as never) ?? VACIO;
  }, [empresas]);

  const cargando = iniciativas === undefined || empresas === undefined;

  const { visibles, nAbiertos, nCerrados } = useMemo(() => {
    const todas = iniciativas ?? [];
    // PRD §6.3: "cerrado" incluye los DEFERRED que aún no toca retomar.
    const abiertas = todas.filter((i) => !leadOculto(i.salida, hoy));
    const cerradas = todas.filter((i) => leadOculto(i.salida, hoy));

    const base =
      filtro === "abiertos" ? abiertas : filtro === "cerrados" ? cerradas : todas;

    const texto = q.trim().toLowerCase();
    const filtradas = texto
      ? base.filter((i) =>
          (nombreEmpresa(i.empresaId) + " " + i.nombre).toLowerCase().includes(texto)
        )
      : base;

    return {
      visibles: filtradas,
      nAbiertos: abiertas.length,
      nCerrados: cerradas.length,
    };
  }, [iniciativas, filtro, q, hoy, nombreEmpresa]);

  const tabs: { id: Filtro; label: string; n: number }[] = [
    { id: "abiertos", label: "Abiertos", n: nAbiertos },
    { id: "cerrados", label: "Cerrados", n: nCerrados },
    { id: "todos", label: "Todos", n: (iniciativas ?? []).length },
  ];

  return (
    <>
      <PageHead title="Leads" sub="Una empresa puede tener varios proyectos" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltro(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
                filtro === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              <span
                className={cn(
                  "font-heading text-[11px] tabular-nums",
                  filtro === t.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t.n}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por empresa o proyecto…"
            className="pl-9"
          />
        </div>
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <Vacio hayLeads={(iniciativas ?? []).length > 0} filtro={filtro} />
      ) : (
        <>
          {/* Tabla — escritorio */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                  <th className="px-4 py-3 text-left font-semibold">Proyecto</th>
                  <th className="px-4 py-3 text-left font-semibold">Etapa</th>
                  <th className="px-4 py-3 text-left font-semibold">Próxima acción</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((i) => {
                  const tarea = proximas?.[i._id];
                  const cerrado = leadOculto(i.salida, hoy);
                  const vencida = !!tarea && tarea.fecha < hoy;
                  return (
                    <tr
                      key={i._id}
                      onClick={() => navigate(`/leads/${i._id}`)}
                      className={cn(
                        "cursor-pointer border-t border-border transition-colors hover:bg-muted/40",
                        cerrado && "opacity-70"
                      )}
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {nombreEmpresa(i.empresaId)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{i.nombre}</td>
                      <td className="px-4 py-3">
                        {i.salida ? (
                          <SalidaBadge salida={i.salida} />
                        ) : (
                          <StagePill stage={i.stage} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <ProximaAccion tarea={tarea} vencida={vencida} />
                      </td>
                      <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                        {fmtUSD(montoDe(i.data))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tarjetas — teléfono (PRD §8.1) */}
          <div className="space-y-2 md:hidden">
            {visibles.map((i) => {
              const tarea = proximas?.[i._id];
              const vencida = !!tarea && tarea.fecha < hoy;
              return (
                <button
                  key={i._id}
                  type="button"
                  onClick={() => navigate(`/leads/${i._id}`)}
                  className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {nombreEmpresa(i.empresaId)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {i.nombre}
                      </p>
                    </div>
                    <span className="shrink-0 font-heading text-sm tabular-nums text-foreground">
                      {fmtUSD(montoDe(i.data))}
                    </span>
                  </div>

                  <div className="mt-3">
                    {i.salida ? (
                      <SalidaBadge salida={i.salida} />
                    ) : (
                      <StagePill stage={i.stage} />
                    )}
                  </div>

                  <div className="mt-2 text-[13px]">
                    <ProximaAccion tarea={tarea} vencida={vencida} />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/** PRD §4.3: la próxima acción es la tarea abierta más próxima. */
function ProximaAccion({
  tarea,
  vencida,
}: {
  tarea?: { titulo: string; fecha: string };
  vencida: boolean;
}) {
  if (!tarea) {
    return <span className="text-muted-foreground">{VACIO}</span>;
  }
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

/** Monto que representa mejor al lead, del más firme al más tentativo. */
function montoDe(data: {
  montoFinal?: number;
  montoNegociado?: number;
  montoPropuesta?: number;
  capex?: number;
}): number | undefined {
  return (
    data.montoFinal ?? data.montoNegociado ?? data.montoPropuesta ?? data.capex
  );
}

function Vacio({ hayLeads, filtro }: { hayLeads: boolean; filtro: Filtro }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-heading text-sm font-medium text-foreground">
        {hayLeads
          ? filtro === "cerrados"
            ? "Ningún lead cerrado."
            : "Sin leads en esta vista."
          : "Todavía no hay leads."}
      </p>
      {!hayLeads && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          La base arranca vacía, a propósito. Crea tu primera empresa y su
          proyecto para empezar.
        </p>
      )}
    </div>
  );
}
