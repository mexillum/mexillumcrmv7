import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mensajeDeError } from "@/lib/errores";

/**
 * Diálogo de formulario. Se encarga del estado de envío y de convertir
 * el error del servidor en un aviso legible, para que cada formulario
 * solo tenga que describir sus campos.
 */
export function FormDialog({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  onGuardar,
  guardarLabel = "Guardar",
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  onGuardar: () => Promise<unknown>;
  guardarLabel?: string;
  children: React.ReactNode;
}) {
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onGuardar();
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
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">{titulo}</DialogTitle>
            {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-4 py-4">{children}</div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : guardarLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
