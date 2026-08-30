import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { User } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { fmtFecha } from "@/lib/formato";
import { cn } from "@/lib/utils";

/** Una tarea con su lead, tal como la enseñan el Panel y Acciones. */
export function FilaTarea({
  tarea,
  sub,
  leadId,
  hoy,
  contactos,
}: {
  tarea: Doc<"tareas">;
  sub: string;
  leadId: string;
  hoy: string;
  contactos?: string[];
}) {
  const navigate = useNavigate();
  const alternar = useMutation(api.tareas.toggle);
  const vencida = !tarea.done && tarea.fecha < hoy;

  return (
    <div className="group flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-muted/50">
      <Checkbox
        checked={tarea.done}
        onCheckedChange={() => void alternar({ id: tarea._id })}
        aria-label={`Completar ${tarea.titulo}`}
      />
      <button
        type="button"
        onClick={() => navigate(`/leads/${leadId}`)}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={cn(
            "truncate text-[13px]",
            tarea.done ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {tarea.titulo}
        </p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
        {contactos && contactos.length > 0 && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <User className="size-3 shrink-0" />
            {contactos.join(", ")}
          </p>
        )}
      </button>
      <span
        className={cn(
          "shrink-0 font-heading text-xs tabular-nums",
          vencida ? "font-semibold text-destructive" : "text-muted-foreground"
        )}
      >
        {fmtFecha(tarea.fecha)}
      </span>
    </div>
  );
}
