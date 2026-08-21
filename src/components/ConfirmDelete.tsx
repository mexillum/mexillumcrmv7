import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
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
import { mensajeDeError } from "@/lib/errores";

/**
 * Borrado permanente y en cascada (PRD §8).
 *
 * No hay papelera ni deshacer, así que el diálogo hace dos cosas antes
 * de dejar pulsar: enseña el recuento REAL de lo que va a destruir, y
 * exige escribir el nombre del registro. Sirve para que nadie borre
 * meses de historial por un clic de más.
 */
export function ConfirmDelete({
  abierto,
  onCerrar,
  nombre,
  arrastra,
  onBorrar,
  cargando,
}: {
  abierto: boolean;
  onCerrar: () => void;
  nombre: string;
  /** Qué se lleva por delante: [cantidad, singular, plural]. */
  arrastra: [number, string, string][];
  onBorrar: () => Promise<unknown>;
  cargando?: boolean;
}) {
  const [escrito, setEscrito] = useState("");
  const [borrando, setBorrando] = useState(false);

  const coincide = escrito.trim() === nombre.trim();
  const conCosas = arrastra.filter(([n]) => n > 0);

  async function borrar() {
    if (!coincide) return;
    setBorrando(true);
    try {
      await onBorrar();
      toast.success("Borrado.");
      onCerrar();
    } catch (error) {
      console.error(error);
      toast.error(mensajeDeError(error));
    } finally {
      setBorrando(false);
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (!v) {
          setEscrito("");
          onCerrar();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <AlertTriangle className="size-4 text-destructive" />
            Borrar {nombre}
          </DialogTitle>
          <DialogDescription>
            Esto es permanente. No hay papelera ni deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-destructive-soft p-3">
            {cargando ? (
              <p className="text-[13px] text-destructive">Contando…</p>
            ) : conCosas.length === 0 ? (
              <p className="text-[13px] text-destructive">
                No arrastra nada más.
              </p>
            ) : (
              <>
                <p className="text-[13px] font-medium text-destructive">
                  También se borrará:
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {conCosas.map(([n, singular, plural]) => (
                    <li key={singular} className="text-[13px] text-destructive">
                      <span className="font-heading tabular-nums">{n}</span>{" "}
                      {n === 1 ? singular : plural}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar" className="text-[13px]">
              Escribe <span className="font-heading">{nombre}</span> para
              confirmar
            </Label>
            <Input
              id="confirmar"
              value={escrito}
              onChange={(e) => setEscrito(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder={nombre}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!coincide || borrando}
            onClick={() => void borrar()}
          >
            {borrando ? "Borrando…" : "Borrar para siempre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
