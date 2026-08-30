import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { AlertCircle, Clock, CheckCircle2, Printer } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { leadOculto } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { FilaTarea } from "@/components/FilaTarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { hoyISO, fmtFecha, fmtFechaLarga, VACIO } from "@/lib/formato";
import { contactosDeTarea } from "@/lib/tareas";

/** PRD §8: todos los pendientes en vencidas / próximas / completadas. */
export function Acciones() {
  const hoy = hoyISO();
  const tareas = useQuery(api.tareas.list);
  const iniciativas = useQuery(api.iniciativas.list);
  const empresas = useQuery(api.empresas.list);
  const contactos = useQuery(api.contactos.list);
  const [incluirCerrados, setIncluirCerrados] = useState(false);

  const cargando =
    tareas === undefined ||
    iniciativas === undefined ||
    empresas === undefined ||
    contactos === undefined;

  const nombreEmpresa = useMemo(() => {
    const mapa = new Map((empresas ?? []).map((e) => [e._id as string, e.nombre]));
    return (id: string) => mapa.get(id) ?? VACIO;
  }, [empresas]);

  const nombresContacto = useMemo(() => {
    const mapa = new Map((contactos ?? []).map((c) => [c._id as string, c.nombre]));
    return (t: Doc<"tareas">) =>
      contactosDeTarea(t)
        .map((id) => mapa.get(id))
        .filter(Boolean) as string[];
  }, [contactos]);

  const grupos = useMemo(() => {
    const porId = new Map(
      (iniciativas ?? []).map((i) => [i._id as string, i])
    );

    const vivas = (tareas ?? []).filter((t) => {
      const lead = porId.get(t.iniciativaId);
      if (!lead) return false;
      return incluirCerrados || !leadOculto(lead.salida, hoy);
    });

    const sub = (t: Doc<"tareas">) => {
      const lead = porId.get(t.iniciativaId);
      if (!lead) return VACIO;
      return `${nombreEmpresa(lead.empresaId)} · ${lead.nombre}`;
    };

    return {
      vencidas: vivas
        .filter((t) => !t.done && t.fecha < hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      proximas: vivas
        .filter((t) => !t.done && t.fecha >= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      completadas: vivas
        .filter((t) => t.done)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      sub,
    };
  }, [tareas, iniciativas, nombreEmpresa, hoy, incluirCerrados]);

  if (cargando) {
    return (
      <>
        <PageHead title="Acciones" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead
        title="Acciones"
        sub="Toda tarea lleva fecha; por eso puede estar vencida"
        action={
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-muted-foreground">
              <Checkbox
                checked={incluirCerrados}
                onCheckedChange={(v) => setIncluirCerrados(v === true)}
              />
              Incluir leads cerrados
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={grupos.vencidas.length === 0 && grupos.proximas.length === 0}
            >
              <Printer className="size-4" />
              Imprimir / PDF
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        <Grupo
          titulo="Vencidas"
          icono={<AlertCircle className="size-4 text-destructive" />}
          n={grupos.vencidas.length}
          vacio="Nada vencido. Vas al día."
        >
          {grupos.vencidas.map((t) => (
            <FilaTarea
              key={t._id}
              tarea={t}
              leadId={t.iniciativaId}
              hoy={hoy}
              sub={grupos.sub(t)}
              contactos={nombresContacto(t)}
            />
          ))}
        </Grupo>

        <Grupo
          titulo="Próximas"
          icono={<Clock className="size-4 text-primary" />}
          n={grupos.proximas.length}
          vacio="Sin acciones pendientes."
        >
          {grupos.proximas.map((t) => (
            <FilaTarea
              key={t._id}
              tarea={t}
              leadId={t.iniciativaId}
              hoy={hoy}
              sub={grupos.sub(t)}
              contactos={nombresContacto(t)}
            />
          ))}
        </Grupo>

        <Grupo
          titulo="Completadas"
          icono={<CheckCircle2 className="size-4 text-[color:var(--success)]" />}
          n={grupos.completadas.length}
          vacio="Todavía no has completado ninguna."
        >
          {grupos.completadas.slice(0, 30).map((t) => (
            <FilaTarea
              key={t._id}
              tarea={t}
              leadId={t.iniciativaId}
              hoy={hoy}
              sub={grupos.sub(t)}
              contactos={nombresContacto(t)}
            />
          ))}
        </Grupo>
      </div>

      <HojaImprimible
        vencidas={grupos.vencidas}
        proximas={grupos.proximas}
        sub={grupos.sub}
        contactos={nombresContacto}
        hoy={hoy}
      />
    </>
  );
}

/** Vista solo-impresión: vencidas arriba, pendientes después, con una
 *  línea en blanco bajo cada acción para anotar la próxima. */
function HojaImprimible({
  vencidas,
  proximas,
  sub,
  contactos,
  hoy,
}: {
  vencidas: Doc<"tareas">[];
  proximas: Doc<"tareas">[];
  sub: (t: Doc<"tareas">) => string;
  contactos: (t: Doc<"tareas">) => string[];
  hoy: string;
}) {
  const totalPendientes = vencidas.length + proximas.length;

  return (
    <div id="imprimir-acciones">
      <header
        style={{
          borderBottom: "2px solid #111",
          paddingBottom: "3mm",
          marginBottom: "7mm",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "8mm",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "8.5pt",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#666",
              marginBottom: "1mm",
            }}
          >
            Mexillum CRM
          </div>
          <h1 style={{ fontSize: "18pt", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Acciones pendientes
          </h1>
        </div>
        <div style={{ textAlign: "right", fontSize: "9pt", color: "#555" }}>
          <div>Impreso el {fmtFechaLarga(hoy)}</div>
          <div style={{ marginTop: "0.5mm" }}>
            {totalPendientes} {totalPendientes === 1 ? "acción" : "acciones"}
          </div>
        </div>
      </header>

      <SeccionImprimible titulo="Vencidas" tareas={vencidas} sub={sub} contactos={contactos} />
      <SeccionImprimible titulo="Pendientes" tareas={proximas} sub={sub} contactos={contactos} />
    </div>
  );
}

function SeccionImprimible({
  titulo,
  tareas,
  sub,
  contactos,
}: {
  titulo: string;
  tareas: Doc<"tareas">[];
  sub: (t: Doc<"tareas">) => string;
  contactos: (t: Doc<"tareas">) => string[];
}) {
  // Sección vacía: no se imprime.
  if (tareas.length === 0) return null;

  return (
    <div className="imprimir-seccion" style={{ marginBottom: "8mm" }}>
      <h2
        style={{
          fontSize: "9.5pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#111",
          marginBottom: "3.5mm",
        }}
      >
        {titulo}
        <span style={{ color: "#999", fontWeight: 600, marginLeft: "2mm" }}>
          {tareas.length}
        </span>
      </h2>

      {tareas.map((t, i) => {
        const gente = contactos(t);
        return (
          <div
            key={t._id}
            className="imprimir-fila"
            style={{
              display: "flex",
              gap: "3mm",
              paddingBottom: "3mm",
              marginBottom: "3.5mm",
              borderBottom: "0.5pt solid #ddd",
            }}
          >
            <div
              style={{
                fontSize: "9pt",
                fontWeight: 700,
                color: "#999",
                minWidth: "6mm",
                paddingTop: "0.3mm",
              }}
            >
              {i + 1}.
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11pt", fontWeight: 600 }}>{t.titulo}</div>
              <div style={{ fontSize: "9pt", color: "#555", marginTop: "0.5mm" }}>
                {sub(t)}
                <span style={{ color: "#999" }}> · {fmtFecha(t.fecha)}</span>
                {gente.length > 0 && (
                  <span> · {gente.join(", ")}</span>
                )}
              </div>
              <div style={{ marginTop: "4mm", display: "flex", alignItems: "flex-end", gap: "2mm" }}>
                <span
                  style={{
                    fontSize: "7.5pt",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#999",
                    paddingBottom: "0.5mm",
                  }}
                >
                  Próxima acción
                </span>
                <span style={{ flex: 1, borderBottom: "0.5pt solid #bbb" }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Grupo({
  titulo,
  icono,
  n,
  vacio,
  children,
}: {
  titulo: string;
  icono: React.ReactNode;
  n: number;
  vacio: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
        {icono}
        {titulo}
        <span className="font-heading text-xs tabular-nums text-muted-foreground">
          {n}
        </span>
      </h2>
      {n === 0 ? (
        <p className="text-[13px] text-muted-foreground">{vacio}</p>
      ) : (
        <div className="space-y-0.5">{children}</div>
      )}
    </section>
  );
}
