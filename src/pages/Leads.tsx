import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Search, Table2, Columns3 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { PageHead } from "@/components/Shell";
import { StagePill, SalidaBadge } from "@/components/StagePill";
import { ProximaAccion } from "@/components/ProximaAccion";
import { LeadCard } from "@/components/LeadCard";
import { Tablero } from "@/components/Tablero";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtUSD, hoyISO, VACIO } from "@/lib/formato";
import { armarLeads, montoDe, type LeadVista } from "@/lib/leads";
import { usePreferencia } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

type Filtro = "abiertos" | "cerrados" | "todos";
type Vista = "tabla" | "tablero";
const VISTAS = ["tabla", "tablero"] as const;

export function Leads() {
  const hoy = hoyISO();

  const iniciativas = useQuery(api.iniciativas.list);
  const empresas = useQuery(api.empresas.list);
  const proximas = useQuery(api.tareas.proximasAcciones);

  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("abiertos");
  // PRD §8: la elección Tabla / Tablero se recuerda.
  const [vista, setVista] = usePreferencia<Vista>("leads.vista", "tabla", VISTAS);

  const nombreEmpresa = useMemo(() => {
    const mapa = new Map((empresas ?? []).map((e) => [e._id as string, e.nombre]));
    return (id: string) => mapa.get(id) ?? VACIO;
  }, [empresas]);

  const cargando = iniciativas === undefined || empresas === undefined;

  const { visibles, nAbiertos, nCerrados, total } = useMemo(() => {
    const todos = armarLeads(iniciativas ?? [], proximas, hoy);
    const abiertos = todos.filter((l) => !l.oculto);
    const cerrados = todos.filter((l) => l.oculto);

    const base =
      filtro === "abiertos" ? abiertos : filtro === "cerrados" ? cerrados : todos;

    const texto = q.trim().toLowerCase();
    const filtrados = texto
      ? base.filter((l) =>
          (nombreEmpresa(l.empresaId) + " " + l.nombre).toLowerCase().includes(texto)
        )
      : base;

    return {
      visibles: filtrados,
      nAbiertos: abiertos.length,
      nCerrados: cerrados.length,
      total: todos.length,
    };
  }, [iniciativas, proximas, filtro, q, hoy, nombreEmpresa]);

  const tabs: { id: Filtro; label: string; n: number }[] = [
    { id: "abiertos", label: "Abiertos", n: nAbiertos },
    { id: "cerrados", label: "Cerrados", n: nCerrados },
    { id: "todos", label: "Todos", n: total },
  ];

  return (
    <>
      <PageHead
        title="Leads"
        sub="Una empresa puede tener varios proyectos"
        action={<CambioVista vista={vista} setVista={setVista} />}
      />

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
        <Vacio hayLeads={total > 0} filtro={filtro} />
      ) : vista === "tablero" ? (
        <Tablero leads={visibles} nombreEmpresa={nombreEmpresa} hoy={hoy} />
      ) : (
        <Tabla leads={visibles} nombreEmpresa={nombreEmpresa} hoy={hoy} />
      )}
    </>
  );
}

function CambioVista({
  vista,
  setVista,
}: {
  vista: Vista;
  setVista: (v: Vista) => void;
}) {
  const opciones = [
    { id: "tabla" as const, label: "Tabla", icon: Table2 },
    { id: "tablero" as const, label: "Tablero", icon: Columns3 },
  ];

  return (
    <div className="flex gap-1 rounded-xl bg-muted p-1">
      {opciones.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setVista(id)}
          aria-pressed={vista === id}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors",
            vista === id
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

function Tabla({
  leads,
  nombreEmpresa,
  hoy,
}: {
  leads: LeadVista[];
  nombreEmpresa: (id: string) => string;
  hoy: string;
}) {
  const navigate = useNavigate();

  return (
    <>
      {/* Escritorio */}
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
            {leads.map((l) => (
              <tr
                key={l._id}
                onClick={() => navigate(`/leads/${l._id}`)}
                className={cn(
                  "cursor-pointer border-t border-border transition-colors hover:bg-muted/40",
                  l.oculto && "opacity-70"
                )}
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  {nombreEmpresa(l.empresaId)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.nombre}</td>
                <td className="px-4 py-3">
                  {l.salida ? (
                    <SalidaBadge salida={l.salida} />
                  ) : (
                    <StagePill stage={l.stage} />
                  )}
                </td>
                <td className="px-4 py-3 text-[13px]">
                  <ProximaAccion tarea={l.proxima} hoy={hoy} />
                </td>
                <td className="px-4 py-3 text-right font-heading tabular-nums text-foreground">
                  {fmtUSD(montoDe(l.data))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teléfono — PRD §8.1 */}
      <div className="space-y-2 md:hidden">
        {leads.map((l) => (
          <LeadCard
            key={l._id}
            lead={l}
            empresa={nombreEmpresa(l.empresaId)}
            hoy={hoy}
          />
        ))}
      </div>
    </>
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
