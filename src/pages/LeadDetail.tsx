import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Undo2,
  RotateCcw,
  MoreHorizontal,
  Pencil,
  Trash2,
  LogOut,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { stageDef, leadOculto } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { Embudo } from "@/components/Embudo";
import { PanelEtapa } from "@/components/PanelEtapa";
import { RegistrarInteraccion } from "@/components/RegistrarInteraccion";
import { Historial } from "@/components/Historial";
import { TareasPanel, type Borrador } from "@/components/TareasPanel";
import { SalidaBadge } from "@/components/StagePill";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadForm } from "@/components/formularios";
import { SalidaDialog } from "@/components/SalidaDialog";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtUSD, fmtMXN, fmtFechaLarga, hoyISO, VACIO } from "@/lib/formato";
import { montoDe } from "@/lib/leads";
import { mensajeDeError } from "@/lib/errores";
import { contactosDeTarea } from "@/lib/tareas";
import { cn } from "@/lib/utils";

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hoy = hoyISO();
  const iniciativaId = id as Id<"iniciativas">;

  const lead = useQuery(api.iniciativas.get, { id: iniciativaId });
  // No pedimos las hijas hasta saber que el lead existe: con un enlace
  // viejo, esas queries fallaban y dejaban la página en blanco en vez
  // de enseñar "este lead ya no existe".
  const tareas = useQuery(
    api.tareas.listByIniciativa,
    lead ? { iniciativaId } : "skip"
  );
  const interacciones = useQuery(
    api.interacciones.listByIniciativa,
    lead ? { iniciativaId } : "skip"
  );
  const empresa = useQuery(
    api.empresas.get,
    lead ? { id: lead.empresaId } : "skip"
  );
  const contactos = useQuery(
    api.contactos.listByEmpresa,
    lead ? { empresaId: lead.empresaId } : "skip"
  );
  const settings = useQuery(api.settings.get);

  const avanzar = useMutation(api.iniciativas.advanceStage);
  const retroceder = useMutation(api.iniciativas.regressStage);
  const reabrir = useMutation(api.iniciativas.reabrir);
  const borrar = useMutation(api.iniciativas.remove);
  const [borrando, setBorrando] = useState(false);
  const previa = useQuery(
    api.iniciativas.deletePreview,
    borrando && lead ? { id: iniciativaId } : "skip"
  );

  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [salida, setSalida] = useState(false);

  // Borrador de acción (nueva o edición): vive aquí para que el panel de
  // contactos pueda agregar o quitar contactos con un click.
  const [borrador, setBorrador] = useState<Borrador | null>(null);

  function abrirNueva() {
    setBorrador({ editar: null, titulo: "", fecha: hoy, contactos: [] });
  }
  function abrirEditar(t: Doc<"tareas">) {
    setBorrador({
      editar: t._id,
      titulo: t.titulo,
      fecha: t.fecha,
      contactos: contactosDeTarea(t) as Id<"contactos">[],
    });
  }
  function alternarContacto(contactoId: Id<"contactos">) {
    setBorrador((b) => {
      if (!b) {
        return { editar: null, titulo: "", fecha: hoy, contactos: [contactoId] };
      }
      const tiene = b.contactos.includes(contactoId);
      return {
        ...b,
        contactos: tiene
          ? b.contactos.filter((x) => x !== contactoId)
          : [...b.contactos, contactoId],
      };
    });
  }

  const nombreContacto = useMemo(() => {
    const mapa = new Map((contactos ?? []).map((c) => [c._id as string, c.nombre]));
    return (id: string) => mapa.get(id);
  }, [contactos]);

  if (lead === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (lead === null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="font-heading text-sm font-medium text-foreground">
          Este lead ya no existe.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/leads")}>
          Volver a Leads
        </Button>
      </div>
    );
  }

  const usdMxn = settings?.usdMxn ?? 18.5;
  const def = stageDef(lead.stage);
  const cerrado = !!lead.salida;
  const oculto = leadOculto(lead.salida, hoy);
  const monto = montoDe(lead.data);

  async function accion(fn: () => Promise<unknown>, exito: string) {
    setOcupado(true);
    try {
      await fn();
      toast.success(exito);
    } catch (error) {
      console.error(error);
      toast.error(mensajeDeError(error));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Link
        to="/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Leads
      </Link>

      <PageHead
        title={lead.nombre}
        sub={empresa?.nombre ?? VACIO}
        action={
          <div className="flex gap-2">
            {!cerrado && (
              <>
              {lead.stage > 1 && (
                <Button
                  variant="outline"
                  disabled={ocupado}
                  onClick={() => {
                    if (
                      !confirm(
                        `¿Regresar a la etapa anterior? Los datos capturados no se borran.`
                      )
                    )
                      return;
                    void accion(
                      () => retroceder({ id: lead._id }),
                      "Etapa retrocedida."
                    );
                  }}
                >
                  <Undo2 className="size-4" />
                  Atrás
                </Button>
              )}
                {lead.stage < 11 && (
                  <Button
                    disabled={ocupado}
                    onClick={() =>
                      void accion(() => avanzar({ id: lead._id }), "Etapa avanzada.")
                    }
                  >
                    Avanzar
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="outline" size="icon" aria-label="Más acciones">
                  <MoreHorizontal className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditando(true)}>
                  <Pencil className="size-4" />
                  Editar lead
                </DropdownMenuItem>
                {!cerrado && lead.stage < 11 && (
                  <DropdownMenuItem onClick={() => setSalida(true)}>
                    <LogOut className="size-4" />
                    Sacar del embudo
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setBorrando(true)}
                >
                  <Trash2 className="size-4" />
                  Borrar lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {/* ── Estado del embudo ─────────────────────────────── */}
      <section className="mb-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <Embudo stage={lead.stage} cerrado={cerrado} />

        <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
          <Dato label="Monto">
            <span className="font-heading tabular-nums">{fmtUSD(monto)}</span>
            {monto != null && (
              <span className="ml-2 font-heading text-xs tabular-nums text-muted-foreground">
                ≈ {fmtMXN(monto, usdMxn)} MXN
              </span>
            )}
          </Dato>
          <Dato label="Cierre estimado">{fmtFechaLarga(lead.cierre)}</Dato>
          <Dato label="Tipo de etapa">
            {def?.kind === "hito" ? "Hito" : "Datos"}
          </Dato>
        </dl>

        {cerrado && lead.salida && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-3">
            <div className="min-w-0">
              <SalidaBadge salida={lead.salida} />
              {lead.salida.nota && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {lead.salida.nota}
                </p>
              )}
              {lead.salida.fechaRetomar && (
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  Retomar el{" "}
                  <span className="font-heading tabular-nums">
                    {fmtFechaLarga(lead.salida.fechaRetomar)}
                  </span>
                  {!oculto && " · ya toca"}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={ocupado}
              onClick={() =>
                void accion(() => reabrir({ id: lead._id }), "Lead reabierto.")
              }
            >
              <RotateCcw className="size-4" />
              Reabrir
            </Button>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <PanelEtapa lead={lead} usdMxn={usdMxn} />
          {!cerrado && (
            <RegistrarInteraccion lead={lead} contactos={contactos ?? []} />
          )}
          <Historial
            interacciones={interacciones ?? []}
            nombreContacto={nombreContacto}
          />
        </div>

        <div className="space-y-4">
          <TareasPanel
            tareas={tareas ?? []}
            iniciativaId={lead._id}
            hoy={hoy}
            contactos={contactos ?? []}
            borrador={borrador}
            setBorrador={setBorrador}
            onNueva={abrirNueva}
            onEditar={abrirEditar}
          />
          <ContactosEmpresa
            contactos={contactos ?? []}
            seleccionados={borrador?.contactos ?? []}
            onToggle={alternarContacto}
          />
        </div>
      </div>

      {editando && (
        <LeadForm abierto onCerrar={() => setEditando(false)} lead={lead} />
      )}
      {salida && (
        <SalidaDialog abierto onCerrar={() => setSalida(false)} lead={lead} />
      )}
      {borrando && (
        <ConfirmDelete
          abierto
          onCerrar={() => setBorrando(false)}
          nombre={lead.nombre}
          cargando={previa === undefined}
          arrastra={[
            [previa?.tareas ?? 0, "acción", "acciones"],
            [previa?.interacciones ?? 0, "interacción", "interacciones"],
          ]}
          onBorrar={async () => {
            await borrar({ id: lead._id });
            navigate("/leads");
          }}
        />
      )}
    </>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function ContactosEmpresa({
  contactos,
  seleccionados,
  onToggle,
}: {
  contactos: Doc<"contactos">[];
  seleccionados: Id<"contactos">[];
  onToggle: (id: Id<"contactos">) => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Contactos de la empresa
      </h2>

      {contactos.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted-foreground">
          Esta empresa todavía no tiene contactos.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {contactos.map((c) => {
            const activo = seleccionados.includes(c._id);
            return (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => onToggle(c._id)}
                  title={activo ? "Quitar de la acción" : "Agregar a la acción"}
                  className={cn(
                    "w-full rounded-lg px-2 py-1.5 text-left transition-colors",
                    activo
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  <p className="text-[13px] font-semibold text-foreground">
                    {c.nombre}
                  </p>
                  {c.puesto && (
                    <p className="text-xs text-muted-foreground">{c.puesto}</p>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {c.email && <span className="truncate">{c.email}</span>}
                    {c.tel && <span className="font-heading tabular-nums">{c.tel}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
