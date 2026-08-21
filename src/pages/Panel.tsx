import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  Clock,
  ChevronRight,
  CircleDashed,
  RotateCcw,
  Snowflake,
  Settings,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { STAGES, leadOculto, esParaRetomar, type Phase } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { FilaTarea } from "@/components/FilaTarea";
import { StagePill } from "@/components/StagePill";
import { Skeleton } from "@/components/ui/skeleton";
import { AjustesDialog } from "@/components/AjustesDialog";
import { fmtUSD, fmtMXN, fmtFechaLarga, hoyISO, VACIO } from "@/lib/formato";
import { montoDe } from "@/lib/leads";
import { cn } from "@/lib/utils";

const DIAS_FRIO = 14;

const PHASE_BG: Record<Phase, string> = {
  "Prospección": "bg-phase-prospeccion",
  "Calificación": "bg-phase-calificacion",
  "Solución": "bg-phase-solucion",
  "Comercial": "bg-phase-comercial",
  "Cierre": "bg-phase-cierre",
};

/** Días entre dos fechas ISO. */
function diasEntre(desde: string, hasta: string): number {
  const a = new Date(desde + "T00:00").getTime();
  const b = new Date(hasta + "T00:00").getTime();
  return Math.floor((b - a) / 86_400_000);
}

function sumaDias(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00");
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function Panel() {
  const hoy = hoyISO();
  const en7dias = sumaDias(hoy, 7);
  const [ajustes, setAjustes] = useState(false);

  const iniciativas = useQuery(api.iniciativas.list);
  const tareas = useQuery(api.tareas.list);
  const empresas = useQuery(api.empresas.list);
  const ultimaInteraccion = useQuery(api.interacciones.ultimaPorIniciativa);
  const settings = useQuery(api.settings.get);

  const cargando =
    iniciativas === undefined || tareas === undefined || empresas === undefined;

  const nombreEmpresa = useMemo(() => {
    const mapa = new Map((empresas ?? []).map((e) => [e._id as string, e.nombre]));
    return (id: string) => mapa.get(id) ?? VACIO;
  }, [empresas]);

  const d = useMemo(() => {
    const todos = iniciativas ?? [];
    const porId = new Map(todos.map((i) => [i._id as string, i]));

    // "Abierto" = sin salida que lo esconda (PRD §6.3).
    const abiertos = todos.filter((i) => !leadOculto(i.salida, hoy));
    // Activos = abiertos que aún no están firmados.
    const activos = abiertos.filter((i) => i.stage < 11 && !i.salida);
    const comerciales = activos.filter((i) => i.stage >= 8 && i.stage <= 10);

    // Solo cuentan las tareas de leads visibles: las de un lead perdido
    // no son trabajo pendiente.
    const vivas = (tareas ?? []).filter((t) => {
      const lead = porId.get(t.iniciativaId);
      return lead && !leadOculto(lead.salida, hoy);
    });

    const vencidas = vivas
      .filter((t) => !t.done && t.fecha < hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const proximas = vivas
      .filter((t) => !t.done && t.fecha >= hoy && t.fecha <= en7dias)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // PRD §4.3: un lead activo sin ninguna tarea abierta no tiene
    // próxima acción, y eso es un problema que hay que ver.
    const conTareaAbierta = new Set(
      vivas.filter((t) => !t.done).map((t) => t.iniciativaId as string)
    );
    const sinAccion = activos.filter((i) => !conTareaAbierta.has(i._id));

    // PRD §6.3: los DEFERRED cuya fecha ya llegó.
    const paraRetomar = todos
      .filter((i) => esParaRetomar(i.salida, hoy))
      .sort((a, b) =>
        (a.salida?.fechaRetomar ?? "").localeCompare(b.salida?.fechaRetomar ?? "")
      );

    // Se enfrían: activos sin interacción en dos semanas.
    const enfriando = activos
      .map((i) => {
        const ultima = ultimaInteraccion?.[i._id];
        return { lead: i, ultima, dias: ultima ? diasEntre(ultima, hoy) : null };
      })
      .filter((x) => x.dias === null || x.dias >= DIAS_FRIO)
      .sort((a, b) => (b.dias ?? 9_999) - (a.dias ?? 9_999))
      .slice(0, 5);

    const valorPipeline = activos.reduce((s, i) => s + (montoDe(i.data) ?? 0), 0);

    const embudo = STAGES.map((st) => {
      const items = abiertos.filter((i) => i.stage === st.id && !i.salida);
      return {
        st,
        n: items.length,
        monto: items.reduce((s, i) => s + (montoDe(i.data) ?? 0), 0),
      };
    });

    return {
      porId,
      abiertos,
      activos,
      comerciales,
      vencidas,
      proximas,
      sinAccion,
      paraRetomar,
      enfriando,
      valorPipeline,
      embudo,
      maxEmbudo: Math.max(1, ...embudo.map((e) => e.n)),
    };
  }, [iniciativas, tareas, ultimaInteraccion, hoy, en7dias]);

  const usdMxn = settings?.usdMxn ?? 18.5;

  if (cargando) {
    return (
      <>
        <PageHead title="Panel" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  const subtitulo = new Date(hoy + "T00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHead title="Panel" sub={subtitulo[0].toUpperCase() + subtitulo.slice(1)} />

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Leads abiertos"
          valor={d.abiertos.length}
          nota={`${d.activos.length} activos`}
        />
        <Kpi
          label="En fase comercial"
          valor={d.comerciales.length}
          nota="Etapas 08 a 10"
          tono="primary"
        />
        <Kpi
          label="Acciones vencidas"
          valor={d.vencidas.length}
          nota={d.vencidas.length === 0 ? "Vas al día" : "Requieren atención"}
          tono={d.vencidas.length > 0 ? "danger" : undefined}
        />
        <Kpi
          label="Próximas 7 días"
          valor={d.proximas.length}
          nota="Acciones por vencer"
        />
      </div>

      {/* ── Hoy ───────────────────────────────────────────── */}
      <Titulo>Hoy</Titulo>
      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        <Tarjeta
          titulo="Vencidas"
          icono={<AlertCircle className="size-4 text-destructive" />}
          enlace="/acciones"
        >
          {d.vencidas.length === 0 ? (
            <Nada texto="Nada vencido. Vas al día." />
          ) : (
            d.vencidas.slice(0, 6).map((t) => (
              <FilaTarea
                key={t._id}
                tarea={t}
                leadId={t.iniciativaId}
                hoy={hoy}
                sub={subLead(d.porId.get(t.iniciativaId), nombreEmpresa)}
              />
            ))
          )}
        </Tarjeta>

        <Tarjeta
          titulo="Próximas"
          icono={<Clock className="size-4 text-primary" />}
          enlace="/acciones"
        >
          {d.proximas.length === 0 ? (
            <Nada texto="Sin acciones en los próximos 7 días." />
          ) : (
            d.proximas.slice(0, 6).map((t) => (
              <FilaTarea
                key={t._id}
                tarea={t}
                leadId={t.iniciativaId}
                hoy={hoy}
                sub={subLead(d.porId.get(t.iniciativaId), nombreEmpresa)}
              />
            ))
          )}
        </Tarjeta>
      </div>

      {/* ── Necesitan una decisión ────────────────────────── */}
      {(d.sinAccion.length > 0 || d.paraRetomar.length > 0) && (
        <>
          <Titulo>Necesitan una decisión</Titulo>
          <div className="mb-6 grid gap-3 lg:grid-cols-2">
            {d.sinAccion.length > 0 && (
              <Tarjeta
                titulo="Sin próxima acción"
                icono={<CircleDashed className="size-4 text-warn" />}
              >
                {d.sinAccion.slice(0, 6).map((lead) => (
                  <FilaLead
                    key={lead._id}
                    lead={lead}
                    empresa={nombreEmpresa(lead.empresaId)}
                    detalle="Nadie sabe qué sigue aquí"
                  />
                ))}
              </Tarjeta>
            )}

            {d.paraRetomar.length > 0 && (
              <Tarjeta
                titulo="Para retomar"
                icono={<RotateCcw className="size-4 text-phase-solucion" />}
              >
                {d.paraRetomar.slice(0, 6).map((lead) => (
                  <FilaLead
                    key={lead._id}
                    lead={lead}
                    empresa={nombreEmpresa(lead.empresaId)}
                    detalle={`Tocaba el ${fmtFechaLarga(lead.salida?.fechaRetomar)}`}
                  />
                ))}
              </Tarjeta>
            )}
          </div>
        </>
      )}

      {/* ── Pipeline ──────────────────────────────────────── */}
      <Titulo>Pipeline</Titulo>
      <section className="mb-6 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div>
          <p className="text-[13px] text-muted-foreground">
            Valor en pipeline (activos)
          </p>
          <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-foreground">
            {fmtUSD(d.valorPipeline)}
          </p>
          <p className="font-heading text-xs tabular-nums text-muted-foreground">
            ≈ {fmtMXN(d.valorPipeline, usdMxn)} MXN
          </p>
          <button
            type="button"
            onClick={() => setAjustes(true)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <Settings className="size-3" />
            Tipo de cambio{" "}
            <span className="font-heading tabular-nums">{usdMxn}</span>
          </button>
        </div>

        <div className="mt-5 space-y-1.5 border-t border-border pt-4">
          {d.embudo.map(({ st, n, monto }) => (
            <div key={st.id} className="flex items-center gap-3">
              <span className="w-6 shrink-0 font-heading text-xs tabular-nums text-muted-foreground">
                {String(st.id).padStart(2, "0")}
              </span>
              <span className="hidden w-44 shrink-0 truncate text-[13px] text-muted-foreground sm:block">
                {st.label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", PHASE_BG[st.phase])}
                  style={{ width: `${(n / d.maxEmbudo) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-heading text-xs tabular-nums text-foreground">
                {n}
              </span>
              <span className="hidden w-24 shrink-0 text-right font-heading text-xs tabular-nums text-muted-foreground sm:block">
                {monto > 0 ? fmtUSD(monto) : ""}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Se enfrían ────────────────────────────────────── */}
      {d.enfriando.length > 0 && (
        <>
          <Titulo>Se están enfriando</Titulo>
          <Tarjeta
            titulo={`Sin contacto en ${DIAS_FRIO} días o más`}
            icono={<Snowflake className="size-4 text-muted-foreground" />}
          >
            {d.enfriando.map(({ lead, dias }) => (
              <FilaLead
                key={lead._id}
                lead={lead}
                empresa={nombreEmpresa(lead.empresaId)}
                detalle={
                  dias === null
                    ? "Nunca se registró una interacción"
                    : `Última interacción hace ${dias} días`
                }
              />
            ))}
          </Tarjeta>
        </>
      )}

      {ajustes && <AjustesDialog abierto onCerrar={() => setAjustes(false)} />}
    </>
  );
}

function subLead(
  lead: Doc<"iniciativas"> | undefined,
  nombreEmpresa: (id: string) => string
): string {
  if (!lead) return VACIO;
  return `${nombreEmpresa(lead.empresaId)} · ${lead.nombre}`;
}

function Kpi({
  label,
  valor,
  nota,
  tono,
}: {
  label: string;
  valor: number | string;
  nota?: string;
  tono?: "primary" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-bold leading-none tabular-nums",
          tono === "primary" && "text-primary",
          tono === "danger" && "text-destructive",
          !tono && "text-foreground"
        )}
      >
        {valor}
      </p>
      {nota && <p className="mt-1.5 text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

function Tarjeta({
  titulo,
  icono,
  enlace,
  children,
}: {
  titulo: string;
  icono: React.ReactNode;
  enlace?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          {icono}
          {titulo}
        </h3>
        {enlace && (
          <Link
            to={enlace}
            className="inline-flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver todas
            <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function FilaLead({
  lead,
  empresa,
  detalle,
}: {
  lead: Doc<"iniciativas">;
  empresa: string;
  detalle: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/leads/${lead._id}`)}
      className="w-full rounded-lg px-1 py-2 text-left hover:bg-muted/50"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] font-medium text-foreground">
          {empresa} · {lead.nombre}
        </p>
        <StagePill stage={lead.stage} className="shrink-0 text-xs" />
      </div>
      <p className="truncate text-xs text-muted-foreground">{detalle}</p>
    </button>
  );
}

function Nada({ texto }: { texto: string }) {
  return <p className="py-2 text-[13px] text-muted-foreground">{texto}</p>;
}
