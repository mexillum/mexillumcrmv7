import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { SALIDAS, MOTIVOS_PERDIDA, stageDef } from "../../convex/stages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { mensajeDeError } from "@/lib/errores";
import { cn } from "@/lib/utils";

const itemsMotivo = MOTIVOS_PERDIDA.map((m) => ({ value: m, label: m }));

/**
 * Sacar un lead del embudo (PRD §6.3).
 *
 * Cada salida tiene un rango de etapas donde es la esperada. Fuera de
 * ese rango sigue permitida, pero se marca como excepcional y hay que
 * reconocerlo a mano: no se amplían permisos, se deja constancia.
 */
export function SalidaDialog({
  abierto,
  onCerrar,
  lead,
}: {
  abierto: boolean;
  onCerrar: () => void;
  lead: Doc<"iniciativas">;
}) {
  const marcarSalida = useMutation(api.iniciativas.marcarSalida);

  const [estado, setEstado] = useState<string>("");
  const [motivo, setMotivo] = useState(MOTIVOS_PERDIDA[0]);
  const [nota, setNota] = useState("");
  const [fechaRetomar, setFechaRetomar] = useState(hoyISO());
  const [reconocido, setReconocido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const elegida = SALIDAS.find((s) => s.value === estado);
  const [desde, hasta] = elegida?.normal ?? [0, 0];
  const excepcional =
    !!elegida && (lead.stage < desde || lead.stage > hasta);
  const def = stageDef(lead.stage);

  const puedeGuardar =
    !!elegida && (!excepcional || reconocido) && !enviando;

  async function guardar() {
    if (!elegida) return;
    setEnviando(true);
    try {
      await marcarSalida({
        id: lead._id,
        salida: {
          estado: elegida.value,
          motivo: elegida.value === "LOST" ? motivo : undefined,
          nota: nota.trim() || undefined,
          fechaRetomar:
            elegida.value === "DEFERRED" ? fechaRetomar : undefined,
          exceptionAcknowledged: excepcional ? true : undefined,
        },
      });
      toast.success("Lead fuera del embudo.");
      onCerrar();
    } catch (error) {
      console.error(error);
      toast.error(mensajeDeError(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Sacar del embudo</DialogTitle>
          <DialogDescription>
            El lead no se borra. Se puede reabrir cuando quieras.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            {SALIDAS.map((s) => {
              const fuera = lead.stage < s.normal[0] || lead.stage > s.normal[1];
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setEstado(s.value);
                    setReconocido(false);
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                    estado === s.value
                      ? "border-primary bg-secondary"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Normal en las etapas{" "}
                      {String(s.normal[0]).padStart(2, "0")}–
                      {String(s.normal[1]).padStart(2, "0")}
                    </p>
                  </div>
                  {fuera && (
                    <span className="shrink-0 rounded-md bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn">
                      Excepcional
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {elegida?.value === "LOST" && (
            <div className="space-y-2">
              <Label className="text-[13px]">Motivo</Label>
              <Select
                items={itemsMotivo}
                value={motivo}
                onValueChange={(v) => setMotivo(v ?? MOTIVOS_PERDIDA[0])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsMotivo.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {elegida?.value === "DEFERRED" && (
            <div className="space-y-2">
              <Label htmlFor="retomar" className="text-[13px]">
                Retomar el
              </Label>
              <Input
                id="retomar"
                type="date"
                value={fechaRetomar}
                onChange={(e) => setFechaRetomar(e.target.value)}
                required
                className="font-heading tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                Ese día el lead reaparece en el Panel, en "Para retomar".
              </p>
            </div>
          )}

          {elegida && (
            <div className="space-y-2">
              <Label htmlFor="salida-nota" className="text-[13px]">
                Nota
              </Label>
              <Textarea
                id="salida-nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                placeholder="Qué pasó, para acordarte dentro de seis meses…"
              />
            </div>
          )}

          {excepcional && (
            <label className="flex items-start gap-2.5 rounded-lg bg-warn-soft p-3">
              <Checkbox
                checked={reconocido}
                onCheckedChange={(v) => setReconocido(v === true)}
                className="mt-0.5"
              />
              <span className="text-[13px] text-warn">
                <AlertTriangle className="mr-1 inline size-3.5 align-[-2px]" />
                El lead está en la etapa{" "}
                <span className="font-medium">{def?.label}</span>, fuera del
                rango normal de esta salida. Lo reconozco.
              </span>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!puedeGuardar}
            onClick={() => void guardar()}
          >
            {enviando ? "Guardando…" : "Sacar del embudo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
