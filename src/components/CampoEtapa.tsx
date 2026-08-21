import { useEffect, useState } from "react";
import type { Campo } from "../../convex/stages";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtMXN, VACIO } from "@/lib/formato";

/**
 * Un campo del panel de etapa. Guarda al salir del campo (onBlur), no
 * en cada tecla: menos escrituras y nada de parpadeos mientras escribes.
 */
export function CampoEtapa({
  campo,
  valor,
  usdMxn,
  derivado,
  onGuardar,
}: {
  campo: Campo;
  valor: string | number | undefined;
  usdMxn: number;
  derivado?: string | null;
  onGuardar: (valor: string | number | undefined) => void;
}) {
  const [borrador, setBorrador] = useState(valor ?? "");

  // Si el valor cambia por fuera (otro dispositivo), refrescamos.
  useEffect(() => {
    setBorrador(valor ?? "");
  }, [valor]);

  const esNumero = campo.type === "usd" || campo.type === "number";

  function guardar() {
    const crudo = String(borrador).trim();
    if (crudo === "") return onGuardar(undefined);
    if (esNumero) {
      const n = Number(crudo);
      return onGuardar(Number.isFinite(n) ? n : undefined);
    }
    onGuardar(crudo);
  }

  // Payback: siempre derivado, nunca escrito a mano (PRD §4.2).
  if (campo.type === "computed") {
    return (
      <Etiqueta campo={campo}>
        <p className="flex h-9 items-center font-heading text-sm tabular-nums text-foreground">
          {derivado ? `${derivado} años` : VACIO}
        </p>
      </Etiqueta>
    );
  }

  if (campo.type === "select") {
    return (
      <Etiqueta campo={campo}>
        <Select
          items={campo.options ?? []}
          value={String(valor ?? "")}
          onValueChange={(v) => onGuardar(v ? v : undefined)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin definir" />
          </SelectTrigger>
          <SelectContent>
            {campo.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Etiqueta>
    );
  }

  if (campo.type === "textarea") {
    return (
      <Etiqueta campo={campo}>
        <Textarea
          value={String(borrador)}
          onChange={(e) => setBorrador(e.target.value)}
          onBlur={guardar}
          rows={3}
          placeholder="Sin definir"
        />
      </Etiqueta>
    );
  }

  return (
    <Etiqueta campo={campo}>
      <Input
        type={campo.type === "date" ? "date" : esNumero ? "number" : "text"}
        value={String(borrador)}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={guardar}
        placeholder={campo.type === "usd" ? "USD" : "Sin definir"}
        className={esNumero || campo.type === "date" ? "font-heading tabular-nums" : ""}
      />
      {/* PRD §4.2: todo monto USD enseña su equivalente aproximado. */}
      {campo.type === "usd" && borrador !== "" && (
        <p className="mt-1 font-heading text-[11px] tabular-nums text-muted-foreground">
          ≈ {fmtMXN(Number(borrador), usdMxn)} MXN
        </p>
      )}
    </Etiqueta>
  );
}

function Etiqueta({
  campo,
  children,
}: {
  campo: Campo;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px]">
        {campo.label}
        {campo.required && (
          <span
            className="text-destructive"
            title="Obligatorio para avanzar de etapa"
          >
            *
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}
