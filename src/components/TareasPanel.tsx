import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtFecha } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Tareas del lead. PRD §4.3: toda tarea lleva fecha obligatoria, porque
 * la próxima acción y las vencidas se calculan a partir de ella.
 */
export function TareasPanel({
  tareas,
  iniciativaId,
  hoy,
}: {
  tareas: Doc<"tareas">[];
  iniciativaId: Id<"iniciativas">;
  hoy: string;
}) {
  const crear = useMutation(api.tareas.create);
  const alternar = useMutation(api.tareas.toggle);
  const borrar = useMutation(api.tareas.remove);

  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [abierto, setAbierto] = useState(false);

  const abiertas = tareas
    .filter((t) => !t.done)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const hechas = tareas
    .filter((t) => t.done)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    try {
      await crear({ iniciativaId, titulo: titulo.trim(), fecha });
      setTitulo("");
      setAbierto(false);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear la tarea.");
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
          onClick={() => setAbierto((v) => !v)}
        >
          <Plus className="size-4" />
          Nueva
        </Button>
      </div>

      {abierto && (
        <form onSubmit={agregar} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Qué hay que hacer…"
            autoFocus
          />
          <Input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="font-heading tabular-nums"
          />
          <Button type="submit">Agregar</Button>
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
  onToggle,
  onBorrar,
}: {
  tarea: Doc<"tareas">;
  vencida: boolean;
  onToggle: () => void;
  onBorrar: () => void;
}) {
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 hover:bg-muted/50">
      <Checkbox checked={tarea.done} onCheckedChange={onToggle} />
      <span
        className={cn(
          "flex-1 text-[13px]",
          tarea.done ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {tarea.titulo}
      </span>
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
