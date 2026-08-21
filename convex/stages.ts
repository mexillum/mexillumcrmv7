/**
 * Definición del embudo (PRD §6). Módulo puro: no importa nada del
 * servidor, así que también se puede importar desde el front.
 */

export type Kind = "hito" | "datos";
export type Phase =
  | "Prospección"
  | "Calificación"
  | "Solución"
  | "Comercial"
  | "Cierre";

export type StageDef = {
  id: number;
  label: string;
  phase: Phase;
  kind: Kind;
  /** Campos de `data` que bloquean el avance si están vacíos (PRD §6.1). */
  required: string[];
};

export const STAGES: StageDef[] = [
  { id: 1, label: "Prospecto sin trabajar", phase: "Prospección", kind: "hito", required: [] },
  { id: 2, label: "Cuenta analizada", phase: "Prospección", kind: "datos", required: [] },
  { id: 3, label: "Contacto inicial enviado", phase: "Calificación", kind: "hito", required: [] },
  { id: 4, label: "Reunión agendada", phase: "Calificación", kind: "hito", required: [] },
  { id: 5, label: "Diagnóstico realizado", phase: "Solución", kind: "datos", required: [] },
  { id: 6, label: "Análisis de viabilidad", phase: "Solución", kind: "datos", required: ["capex", "ahorroAnual"] },
  { id: 7, label: "Propuesta en preparación", phase: "Solución", kind: "datos", required: ["montoPropuesta"] },
  { id: 8, label: "Propuesta enviada", phase: "Comercial", kind: "hito", required: [] },
  { id: 9, label: "Negociación", phase: "Comercial", kind: "datos", required: [] },
  { id: 10, label: "Contrato enviado", phase: "Comercial", kind: "hito", required: [] },
  { id: 11, label: "Contrato firmado", phase: "Cierre", kind: "datos", required: ["fechaFirma", "montoFinal"] },
];

export const PHASES: Phase[] = [
  "Prospección",
  "Calificación",
  "Solución",
  "Comercial",
  "Cierre",
];

export const FIELD_LABELS: Record<string, string> = {
  capex: "CAPEX estimado",
  ahorroAnual: "Ahorro anual estimado",
  montoPropuesta: "Monto de propuesta",
  fechaFirma: "Fecha de firma",
  montoFinal: "Monto final",
};

export const stageDef = (id: number) => STAGES.find((s) => s.id === id);

/**
 * Devuelve los campos obligatorios que faltan para poder salir de `stage`.
 * PRD §6.1: esta regla vive en el servidor, no solo en el formulario.
 */
export function missingRequired(stage: number, data: Record<string, unknown>): string[] {
  const def = stageDef(stage);
  if (!def) return [];
  return def.required.filter((f) => {
    const val = data[f];
    return val === undefined || val === null || val === "";
  });
}

/** Plantillas de tarea por etapa (PRD §7). */
export const STAGE_TASK_TEMPLATES: Record<number, string[]> = {
  1: ["Investigar la empresa", "Identificar un contacto", "Preparar hipótesis de valor"],
  2: ["Completar tesis comercial", "Preparar contacto inicial", "Validar interlocutor"],
  3: ["Dar seguimiento", "Intentar otro canal", "Contactar otro interlocutor"],
  4: ["Confirmar reunión", "Preparar diagnóstico", "Compartir agenda"],
  5: ["Solicitar documentos", "Completar información faltante", "Enviar caso a Ingeniería"],
  6: ["Analizar viabilidad", "Solicitar información faltante", "Revisar resultado técnico"],
  7: ["Preparar propuesta", "Validar números", "Revisar propuesta internamente"],
  8: ["Confirmar recepción", "Agendar revisión", "Dar seguimiento"],
  9: ["Preparar ajuste", "Resolver observaciones", "Confirmar decisión"],
  10: ["Dar seguimiento a firma", "Resolver comentarios legales", "Confirmar fecha de firma"],
  11: [],
};

/** Salidas de pipeline (PRD §6.3). `normal` = rango de etapas esperado. */
export const SALIDAS = [
  { value: "NO_QUALIFY", label: "No califica", normal: [1, 4] as const, exige: null },
  { value: "NOT_VIABLE", label: "No viable", normal: [5, 7] as const, exige: null },
  { value: "LOST", label: "Perdido", normal: [3, 10] as const, exige: "motivo" },
  { value: "DEFERRED", label: "Retomar después", normal: [1, 10] as const, exige: "fechaRetomar" },
] as const;

/** Las salidas que ocultan el lead para siempre (no vuelven solas). */
export const SALIDAS_CERRADAS = ["NO_QUALIFY", "NOT_VIABLE", "LOST"];

export const MOTIVOS_PERDIDA = [
  "Competencia",
  "Precio",
  "Sin presupuesto",
  "Sin decisión",
  "Otro",
];

/** Etiquetas legibles de cada salida. */
export const SALIDA_LABEL: Record<string, string> = {
  NO_QUALIFY: "No califica",
  NOT_VIABLE: "No viable",
  LOST: "Perdido",
  DEFERRED: "Retomar después",
};

export type Salida = {
  estado: string;
  motivo?: string;
  nota?: string;
  fechaRetomar?: string;
  exceptionAcknowledged?: boolean;
};

/**
 * PRD §6.3 — ¿este lead se esconde de las listas y de los KPIs?
 *
 * - Cerrados (perdido / no califica / no viable): siempre ocultos.
 * - `DEFERRED`: oculto hasta que llega su fecha de retomar. Ese día
 *   vuelve a aparecer, para que "retomar después" no sea un sinónimo
 *   elegante de "perdido".
 */
export function leadOculto(salida: Salida | undefined, hoy: string): boolean {
  if (!salida) return false;
  if (SALIDAS_CERRADAS.includes(salida.estado)) return true;
  if (salida.estado === "DEFERRED") {
    return !salida.fechaRetomar || salida.fechaRetomar > hoy;
  }
  return false;
}

/** Un `DEFERRED` cuya fecha ya llegó: el Panel lo muestra en "Para retomar". */
export function esParaRetomar(salida: Salida | undefined, hoy: string): boolean {
  return (
    salida?.estado === "DEFERRED" &&
    !!salida.fechaRetomar &&
    salida.fechaRetomar <= hoy
  );
}

// ── Catálogos (PRD §5) ───────────────────────────────────────

export const SEGMENTOS = [
  "Cemento y materiales de construcción",
  "Acero y metales",
  "Petróleo y gas",
  "Energía y servicios públicos",
  "Minería",
  "Química y petroquímica",
  "Alimentos y bebidas",
  "Automotriz y autopartes",
];

export const TARIFAS = [
  { value: "gdmth", label: "GDMTH — Gran Demanda Media Tensión Horaria" },
  { value: "gdmto", label: "GDMTO — Gran Demanda Media Tensión Ordinaria" },
  { value: "dist", label: "DIST o DIT — Subtransmisión / Transmisión" },
  { value: "gdbt", label: "GDBT — Gran Demanda Baja Tensión" },
  { value: "pdbt", label: "PDBT — Pequeña Demanda Baja Tensión (<25 kW)" },
  { value: "privado", label: "Contrato privado" },
];

export const GENERADORES = ["Mexillum", "Intermepro"];
export const TIPOS_SISTEMA = ["SFV", "BESS", "SFV + BESS"];
export const TIPOS_INTERACCION = ["Nota", "Llamada", "Reunión", "Correo"];

// ── Campos por etapa-con-datos (PRD §6.1) ────────────────────

export type CampoTipo =
  | "text"
  | "textarea"
  | "number"
  | "usd"
  | "date"
  | "select"
  | "computed";

export type Campo = {
  key: string;
  label: string;
  type: CampoTipo;
  options?: { value: string; label: string }[];
  required?: boolean;
};

const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

export const STAGE_FIELDS: Record<number, Campo[]> = {
  2: [
    { key: "segmento", label: "Segmento", type: "select", options: opts(SEGMENTOS) },
    { key: "generador", label: "Generador", type: "select", options: opts(GENERADORES) },
    { key: "tipoSistema", label: "Tipo de sistema", type: "select", options: opts(TIPOS_SISTEMA) },
    { key: "hipotesisValor", label: "Hipótesis de valor", type: "textarea" },
  ],
  5: [
    { key: "recibosCFE", label: "Recibos CFE recibidos", type: "select", options: opts(["Sí", "No", "Parcial"]) },
    { key: "tarifa", label: "Tarifa CFE", type: "select", options: TARIFAS },
    { key: "consumoMensual", label: "Consumo (kWh/mes)", type: "number" },
    { key: "perfilCarga", label: "Perfil de carga", type: "textarea" },
  ],
  6: [
    { key: "capex", label: "CAPEX estimado", type: "usd", required: true },
    { key: "ahorroAnual", label: "Ahorro anual estimado", type: "usd", required: true },
    { key: "__payback", label: "Payback (años)", type: "computed" },
  ],
  7: [
    { key: "capacidad", label: "Capacidad / alcance del sistema", type: "text" },
    { key: "montoPropuesta", label: "Monto de propuesta", type: "usd", required: true },
    { key: "notasPropuesta", label: "Notas de propuesta", type: "textarea" },
  ],
  9: [
    { key: "montoNegociado", label: "Monto negociado", type: "usd" },
    { key: "objeciones", label: "Objeciones / notas", type: "textarea" },
  ],
  11: [
    { key: "fechaFirma", label: "Fecha de firma", type: "date", required: true },
    { key: "montoFinal", label: "Monto final", type: "usd", required: true },
  ],
};

/** Qué hay que registrar para cumplir cada etapa-hito (PRD §6.1). */
export const HITO_CRITERIO: Record<number, string> = {
  1: "Registra la primera investigación o contacto para dejar de ser prospecto sin trabajar.",
  3: "Registra el primer contacto con un interlocutor identificado.",
  4: "Registra la interacción donde el cliente confirmó fecha y hora de reunión.",
  8: "Registra el envío de la propuesta al cliente.",
  10: "Registra el envío de la versión final del contrato para firma.",
};
