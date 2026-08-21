import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { leadOculto } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { StagePill, SalidaBadge } from "@/components/StagePill";
import { EmpresaForm, ContactoForm, LeadForm } from "@/components/formularios";
import { Historial } from "@/components/Historial";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtUSD, hoyISO } from "@/lib/formato";
import { montoDe } from "@/lib/leads";
import { cn } from "@/lib/utils";

export function EmpresaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hoy = hoyISO();
  const empresaId = id as Id<"empresas">;

  const empresa = useQuery(api.empresas.get, { id: empresaId });
  const iniciativas = useQuery(api.iniciativas.listByEmpresa, { empresaId });
  const contactos = useQuery(api.contactos.listByEmpresa, { empresaId });
  const interacciones = useQuery(api.interacciones.listByEmpresa, { empresaId });
  const [borrando, setBorrando] = useState(false);
  const previa = useQuery(
    api.empresas.deletePreview,
    borrando ? { id: empresaId } : "skip"
  );
  const borrarEmpresa = useMutation(api.empresas.remove);
  const borrarContacto = useMutation(api.contactos.remove);

  const [editando, setEditando] = useState(false);
  const [nuevoContacto, setNuevoContacto] = useState(false);
  const [nuevoLead, setNuevoLead] = useState(false);
  const [editContacto, setEditContacto] = useState<string | null>(null);

  const nombreContacto = useMemo(() => {
    const mapa = new Map((contactos ?? []).map((c) => [c._id as string, c.nombre]));
    return (id: string) => mapa.get(id);
  }, [contactos]);

  if (empresa === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (empresa === null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="font-heading text-sm font-medium text-foreground">
          Esta empresa ya no existe.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/empresas")}>
          Volver a Empresas
        </Button>
      </div>
    );
  }

  const contactoEditado = (contactos ?? []).find((c) => c._id === editContacto);

  return (
    <>
      <Link
        to="/empresas"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Empresas
      </Link>

      <PageHead
        title={empresa.nombre}
        sub={empresa.segmento ?? "Sin segmento"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditando(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Borrar empresa"
              onClick={() => setBorrando(true)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {/* Proyectos */}
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Proyectos
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setNuevoLead(true)}
              >
                <Plus className="size-4" />
                Nuevo
              </Button>
            </div>

            {(iniciativas ?? []).length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Esta empresa todavía no tiene proyectos.
              </p>
            ) : (
              <div className="space-y-1">
                {(iniciativas ?? []).map((i) => (
                  <button
                    key={i._id}
                    type="button"
                    onClick={() => navigate(`/leads/${i._id}`)}
                    className={cn(
                      "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-1 py-2 text-left hover:bg-muted/50",
                      leadOculto(i.salida, hoy) && "opacity-70"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {i.nombre}
                    </span>
                    {i.salida ? (
                      <SalidaBadge salida={i.salida} />
                    ) : (
                      <StagePill stage={i.stage} className="text-xs" />
                    )}
                    <span className="w-20 shrink-0 text-right font-heading text-xs tabular-nums text-muted-foreground">
                      {fmtUSD(montoDe(i.data))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* PRD §8: historial consolidado de todos sus proyectos. */}
          <Historial
            interacciones={interacciones ?? []}
            nombreContacto={nombreContacto}
          />
        </div>

        {/* Contactos */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Contactos
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => setNuevoContacto(true)}
            >
              <Plus className="size-4" />
              Nuevo
            </Button>
          </div>

          {(contactos ?? []).length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Sin contactos. Sirven para todos los proyectos de la empresa.
            </p>
          ) : (
            <ul className="space-y-3">
              {(contactos ?? []).map((c) => (
                <li key={c._id} className="group flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">
                      {c.nombre}
                    </p>
                    {c.puesto && (
                      <p className="text-xs text-muted-foreground">{c.puesto}</p>
                    )}
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {c.email && <span className="truncate">{c.email}</span>}
                      {c.tel && (
                        <span className="font-heading tabular-nums">{c.tel}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setEditContacto(c._id)}
                      title="Editar contacto"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Borrar contacto"
                      onClick={() => {
                        if (!confirm(`¿Borrar a ${c.nombre}? No se puede deshacer.`))
                          return;
                        void borrarContacto({ id: c._id });
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editando && (
        <EmpresaForm abierto onCerrar={() => setEditando(false)} empresa={empresa} />
      )}
      {nuevoContacto && (
        <ContactoForm
          abierto
          onCerrar={() => setNuevoContacto(false)}
          empresaId={empresaId}
        />
      )}
      {contactoEditado && (
        <ContactoForm
          abierto
          onCerrar={() => setEditContacto(null)}
          contacto={contactoEditado}
        />
      )}
      {nuevoLead && (
        <LeadForm abierto onCerrar={() => setNuevoLead(false)} empresaId={empresaId} />
      )}
      {borrando && (
        <ConfirmDelete
          abierto
          onCerrar={() => setBorrando(false)}
          nombre={empresa.nombre}
          cargando={previa === undefined}
          arrastra={[
            [previa?.iniciativas ?? 0, "proyecto", "proyectos"],
            [previa?.contactos ?? 0, "contacto", "contactos"],
            [previa?.tareas ?? 0, "acción", "acciones"],
            [previa?.interacciones ?? 0, "interacción", "interacciones"],
          ]}
          onBorrar={async () => {
            await borrarEmpresa({ id: empresaId });
            navigate("/empresas");
          }}
        />
      )}
    </>
  );
}
