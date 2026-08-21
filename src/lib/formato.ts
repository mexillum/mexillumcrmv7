/** Formato de fechas y montos. PRD §4.2. */

/** Hoy en "YYYY-MM-DD", en hora local (no UTC: cambiaría de día por la noche). */
export function hoyISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Dato desconocido: se muestra como raya, nunca se inventa. */
export const VACIO = "—";

export function fmtUSD(n: number | null | undefined): string {
  if (n == null) return VACIO;
  return "$" + Number(n).toLocaleString("en-US");
}

export function fmtMXN(n: number | null | undefined, usdMxn: number): string {
  if (n == null) return VACIO;
  return "$" + Math.round(Number(n) * usdMxn).toLocaleString("en-US");
}

export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return VACIO;
  return new Date(iso + "T00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

export function fmtFechaLarga(iso: string | null | undefined): string {
  if (!iso) return VACIO;
  return new Date(iso + "T00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Payback en años. PRD §4.2: siempre derivado, nunca capturado. */
export function payback(capex?: number, ahorroAnual?: number): string | null {
  if (!capex || !ahorroAnual) return null;
  return (capex / ahorroAnual).toFixed(1);
}
