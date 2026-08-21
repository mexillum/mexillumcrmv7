import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { MessageSquare, Phone, Users, Mail } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { STAGE_TASK_TEMPLATES, stageDef } from "../../convex/stages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hoyISO } from "@/lib/formato";
import { cn } from "@/lib/utils";

const TIPOS = [
  { value: "Nota", icon: MessageSquare },
  { value: "Llamada", icon: Phone },
  { value: "Reunión", icon: Users },
  { value: "Correo", icon: Mail },
];

const SIN_CONTACTO = "__ninguno";

/** Suma días a una fecha ISO, para las fechas sugeridas de tarea. */
function enDias(dias: number): string {
  const d = new Date(hoyISO() + "T00:00");
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * El mecanismo central del seguimiento (PRD §7): qué pasó y qué sigue,
 * en un solo gesto y una sola transacción.
 */
export function RegistrarInteraccion({
  lead,
  contactos,
}: {
  lead: Doc<"iniciativas">;
  contactos: Doc<"contactos">[];
}) {
  const registrar = useMutation(api.interacciones.registrar);
  const def = stageDef(lead.stage);
  const esHito = def?.kind === "hito";
  const plantillas = STAGE_TASK_TEMPLATES[lead.stage] ?? [];

  const [tipo, setTipo] = useState("Nota");
  const [fecha, setFecha] = useState(hoyISO());
  const [contactoId, setContactoId] = useState<string>(SIN_CONTACTO);
  const [descripcion, setDescripcion] = useState("");

  const [conTarea, setConTarea] = useState(false);
  const [tareaTitulo, setTareaTitulo] = useState("");
  const [tareaFecha, setTareaFecha] = useState(enDias(7));

  const [avanzar, setAvanzar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const itemsContacto = [
    { value: SIN_CONTACTO, label: "Sin contacto" },
    ...contactos.map((c) => ({
      value: c._id as string,
      label: c.puesto ? `${c.nombre} · ${c.puesto}` : c.nombre,
    })),
  ];

  function limpiar() {
    setTipo("Nota");
    setFecha(hoyISO());
    setContactoId(SIN_CONTACTO);
    setDescripcion("");
    setConTarea(false);
    setTareaTitulo("");
    setTareaFecha(enDias(7));
    setAvanzar(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (conTarea && !tareaTitulo.trim()) {
      toast.error("Ponle un título a la próxima acción.");
      return;
    }

    setEnviando(true);
    try {
      await registrar({
        iniciativaId: lead._id,
        tipo,
        fecha,
        contactoId:
          contactoId === SIN_CONTACTO
            ? undefined
            : (contactoId as Id<"contactos">),
        descripcion: descripcion.trim() || undefined,
        avanzar: avanzar || undefined,
        nuevaTarea: conTarea
          ? { titulo: tareaTitulo.trim(), fecha: tareaFecha }
          : undefined,
      });
      toast.success(avanzar ? "Registrado y etapa avanzada." : "Registrado.");
      limpiar();
    } catch (error) {
      console.error(error);
      // El servidor explica qué falta cuando bloquea el avance.
      const msg =
        error instanceof Error
          ? error.message.replace(/^.*Uncaught Error:\s*/s, "").split("\n")[0]
          : "No se pudo registrar.";
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Registrar interacción
      </h2>

      {/* ── Qué pasó ──────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {TIPOS.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTipo(value)}
            aria-pressed={tipo === value}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              tipo === value
                ? "border-primary bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="int-fecha" className="text-[13px]">
            Fecha
          </Label>
          <Input
            id="int-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="font-heading tabular-nums"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[13px]">Contacto</Label>
          <Select
            items={itemsContacto}
            value={contactoId}
            onValueChange={(v) => setContactoId(v ?? SIN_CONTACTO)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsContacto.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="int-desc" className="text-[13px]">
          Qué pasó
        </Label>
        <Textarea
          id="int-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          placeholder="Lo que se dijo, lo que quedó pendiente…"
        />
      </div>

      {/* ── Qué sigue ─────────────────────────────────────── */}
      <div className="mt-5 border-t border-border pt-4">
        <label className="flex items-center gap-2.5">
          <Checkbox
            checked={conTarea}
            onCheckedChange={(v) => setConTarea(v === true)}
          />
          <span className="text-[13px] font-medium text-foreground">
            Definir la próxima acción
          </span>
        </label>

        {conTarea && (
          <div className="mt-3 space-y-3">
            {plantillas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {plantillas.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTareaTitulo(p)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                      tareaTitulo === p
                        ? "border-primary bg-secondary text-secondary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                value={tareaTitulo}
                onChange={(e) => setTareaTitulo(e.target.value)}
                placeholder="Qué sigue…"
              />
              <Input
                type="date"
                value={tareaFecha}
                onChange={(e) => setTareaFecha(e.target.value)}
                required
                className="font-heading tabular-nums"
                title="Toda tarea lleva fecha de vencimiento"
              />
            </div>
          </div>
        )}

        {/* PRD §7: en etapas-hito, la misma interacción avanza la etapa. */}
        {esHito && lead.stage < 11 && !lead.salida && (
          <label className="mt-3 flex items-start gap-2.5 rounded-lg bg-secondary p-3">
            <Checkbox
              checked={avanzar}
              onCheckedChange={(v) => setAvanzar(v === true)}
              className="mt-0.5"
            />
            <span className="text-[13px] text-secondary-foreground">
              Con esto se cumple la etapa{" "}
              <span className="font-medium">{def?.label}</span>. Avanzar a la
              siguiente.
            </span>
          </label>
        )}
      </div>

      <Button type="submit" className="mt-5 w-full" disabled={enviando}>
        {enviando ? "Guardando…" : "Registrar"}
      </Button>
    </form>
  );
}
