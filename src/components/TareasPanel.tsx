import { useMemo } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Plus, Trash2, X, User } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtFecha } from "@/lib/formato";
import { contactosDeTarea } from "@/lib/tareas";
import { cn } from "@/lib/utils";

/** El formulario de nueva/editar acción, controlado desde LeadDetail. */
export type Borrador = {
  editar: Id<"tareas"> | null; // null = acción nueva
  titulo: string;
  fecha: string;
  contactos: Id<"contactos">[];
};

/**
 * Tareas del lead. PRD §4.3: toda tarea lleva fecha obligatoria, porque
 * la próxima acción y las vencidas se calculan a partir de ella.
 *
 * El borrador (formulario abierto) vive en el padre para que el panel de
 * "Contactos de la empresa" pueda agregar o quitar contactos con un click.
 */
export function TareasPanel({
  tareas,
  iniciativaId,
  hoy,
  contactos,
  borrador,
  setBorrador,
  onNueva,
  onEditar,
}: {
  tareas: Doc<"tareas">[];
  iniciativaId: Id<"iniciativas">;
  hoy: string;
  contactos: Doc<"contactos">[];
  borrador: Borrador | null;
  setBorrador: (b: Borrador | null) => void;
  onNueva: () => void;
  onEditar: (t: Doc<"tareas">) => void;
}) {
  const crear = useMutation(api.tareas.create);
  const actualizar = useMutation(api.tareas.update);
  const alternar = useMutation(api.tareas.toggle);
  const borrar = useMutation(api.tareas.remove);

  const nombreContacto = useMemo(() => {
    const mapa = new Map(contactos.map((c) => [c._id as string, c.nombre]));
    return (id: string) => mapa.get(id);
  }, [contactos]);

  const abiertas = tareas
    .filter((t) => !t.done)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const hechas = tareas
    .filter((t) => t.done)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!borrador || !borrador.titulo.trim()) return;
    try {
      if (borrador.editar) {
        await actualizar({
          id: borrador.editar,
          titulo: borrador.titulo.trim(),
          fecha: borrador.fecha,
          contactoIds: borrador.contactos,
        });
      } else {
        await crear({
          iniciativaId,
          titulo: borrador.titulo.trim(),
          fecha: borrador.fecha,
          contactoIds: borrador.contactos,
        });
      }
      setBorrador(null);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la acción.");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Acciones
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => (borrador ? setBorrador(null) : onNueva())}
        >
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      {borrador && (
        <form onSubmit={guardar} className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input
              value={borrador.titulo}
              onChange={(e) =>
                setBorrador({ ...borrador, titulo: e.target.value })
              }
              placeholder="Qué hay que hacer…"
              autoFocus
            />
            <Input
              type="date"
              value={borrador.fecha}
              onChange={(e) =>
                setBorrador({ ...borrador, fecha: e.target.value })
              }
              required
              className="font-heading tabular-nums"
            />
            <Button type="submit">{borrador.editar ? "Guardar" : "Agregar"}</Button>
          </div>

          {borrador.contactos.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {borrador.contactos.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs text-primary"
                >
                  <User className="size-3" />
                  {nombreContacto(id) ?? "Contacto"}
                  <button
                    type="button"
                    onClick={() =>
                      setBorrador({
                        ...borrador,
                        contactos: borrador.contactos.filter((x) => x !== id),
                      })
                    }
                    title="Quitar contacto"
                    className="rounded-full p-0.5 hover:bg-primary/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Haz click en los contactos de la empresa para asignarlos.
            </p>
          )}
        </form>
      )}

      <div className="mt-4 space-y-1">
        {abiertas.length === 0 && hechas.length === 0 && (
          <p className="text-[13px] text-muted-foreground">
            Sin acciones pendientes.
          </p>
        )}

        {abiertas.map((t) => (
          <Fila
            key={t._id}
            tarea={t}
            vencida={t.fecha < hoy}
            editando={borrador?.editar === t._id}
            contactos={contactosDeTarea(t).map(nombreContacto).filter(Boolean) as string[]}
            onEditar={() => onEditar(t)}
            onToggle={() => void alternar({ id: t._id })}
            onBorrar={() => void borrar({ id: t._id })}
          />
        ))}

        {hechas.length > 0 && (
          <p className="pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            Completadas
          </p>
        )}
        {hechas.map((t) => (
          <Fila
            key={t._id}
            tarea={t}
            vencida={false}
            editando={borrador?.editar === t._id}
            contactos={contactosDeTarea(t).map(nombreContacto).filter(Boolean) as string[]}
            onEditar={() => onEditar(t)}
            onToggle={() => void alternar({ id: t._id })}
            onBorrar={() => void borrar({ id: t._id })}
          />
        ))}
      </div>
    </section>
  );
}

function Fila({
  tarea,
  vencida,
  editando,
  contactos,
  onEditar,
  onToggle,
  onBorrar,
}: {
  tarea: Doc<"tareas">;
  vencida: boolean;
  editando: boolean;
  contactos: string[];
  onEditar: () => void;
  onToggle: () => void;
  onBorrar: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-muted/50",
        editando && "bg-primary/5 ring-1 ring-primary/30"
      )}
    >
      <Checkbox checked={tarea.done} onCheckedChange={onToggle} />
      <button
        type="button"
        onClick={onEditar}
        title="Editar acción"
        className="flex-1 text-left"
      >
        <span
          className={cn(
            "text-[13px]",
            tarea.done ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {tarea.titulo}
        </span>
        {contactos.length > 0 && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3 shrink-0" />
            {contactos.join(", ")}
          </span>
        )}
      </button>
      <span
        className={cn(
          "font-heading text-xs tabular-nums",
          vencida ? "font-semibold text-destructive" : "text-muted-foreground"
        )}
      >
        {fmtFecha(tarea.fecha)}
      </span>
      <button
        type="button"
        onClick={onBorrar}
        title="Borrar acción"
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
