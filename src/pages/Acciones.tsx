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
  return (
    <div id="imprimir-acciones">
      <div style={{ marginBottom: "6mm" }}>
        <h1 style={{ fontSize: "16pt", fontWeight: 700, margin: 0 }}>
          Acciones pendientes
        </h1>
        <p style={{ fontSize: "10pt", margin: "1mm 0 0" }}>
          Impreso el {fmtFechaLarga(hoy)}
        </p>
      </div>

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
  return (
    <div style={{ marginBottom: "6mm" }}>
      <h2
        style={{
          fontSize: "12pt",
          fontWeight: 700,
          borderBottom: "1px solid #000",
          paddingBottom: "1mm",
          marginBottom: "3mm",
        }}
      >
        {titulo} ({tareas.length})
      </h2>
      {tareas.length === 0 ? (
        <p style={{ fontSize: "10pt", fontStyle: "italic" }}>Nada aquí.</p>
      ) : (
        tareas.map((t) => (
          <div
            key={t._id}
            className="imprimir-fila"
            style={{ marginBottom: "4mm" }}
          >
            <div style={{ fontSize: "11pt", fontWeight: 600 }}>{t.titulo}</div>
            <div style={{ fontSize: "9.5pt", color: "#333" }}>
              {sub(t)} · {fmtFecha(t.fecha)}
              {contactos(t).length > 0
                ? ` · Contacto: ${contactos(t).join(", ")}`
                : ""}
            </div>
            <div
              style={{
                fontSize: "9pt",
                color: "#555",
                borderBottom: "1px solid #999",
                paddingTop: "3mm",
              }}
            >
              Próxima acción:
            </div>
          </div>
        ))
      )}
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
