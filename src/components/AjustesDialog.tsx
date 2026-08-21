import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FormDialog } from "@/components/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtMXN } from "@/lib/formato";

/**
 * Ajustes. Hoy solo el tipo de cambio (PRD §4.2): vive en la base, no
 * en el código, para que se pueda corregir sin volver a desplegar.
 */
export function AjustesDialog({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const settings = useQuery(api.settings.get);
  const actualizar = useMutation(api.settings.update);
  const [valor, setValor] = useState<string>("");

  const actual = settings?.usdMxn ?? 18.5;
  const borrador = valor === "" ? String(actual) : valor;
  const numero = Number(borrador);

  return (
    <FormDialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Ajustes"
      descripcion="El tipo de cambio solo se usa para mostrar el equivalente aproximado en pesos. Los montos se guardan siempre en USD."
      onGuardar={async () => {
        if (!Number.isFinite(numero) || numero <= 0) {
          throw new Error("El tipo de cambio debe ser un número mayor que cero.");
        }
        await actualizar({ usdMxn: numero });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="tc" className="text-[13px]">
          Tipo de cambio USD → MXN
        </Label>
        <Input
          id="tc"
          type="number"
          step="0.01"
          min="0"
          value={borrador}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          className="font-heading tabular-nums"
        />
        {Number.isFinite(numero) && numero > 0 && (
          <p className="font-heading text-xs tabular-nums text-muted-foreground">
            $1,000 USD ≈ {fmtMXN(1000, numero)} MXN
          </p>
        )}
      </div>
    </FormDialog>
  );
}
