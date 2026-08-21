import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Target, CheckSquare, Building2, Users,
  Plus, ChevronRight, Circle, CheckCircle2, Clock, AlertCircle,
  Search, ArrowUpRight, Calendar, X, Lock, MoreHorizontal,
  Pencil, Trash2, AlertTriangle, MessageSquare, Phone, Mail,
  Users as UsersIcon, ArrowRight, LogOut, RotateCcw, ChevronDown
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Mexillum CRM — prototipo personal
// Sistema visual: JetBrains Mono (headlines + números), Inter (body)
// Primary #2563EB · Text #020062 · Accent #0025AE · Border #E2E8F0
// Empresas → Contactos + Iniciativas(leads) → Interacciones + Acciones
// ─────────────────────────────────────────────────────────────

// ── Tokens ────────────────────────────────────────────────────
const C = {
  bg: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#020062",
  textSoft: "#5B6478",
  textMute: "#8A93A8",
  primary: "#2563EB",
  primarySoft: "#EAF0FE",
  accent: "#0025AE",
  border: "#E2E8F0",
  danger: "#DC2626",
  dangerSoft: "#FEECEC",
  success: "#16A34A",
  warn: "#B8860B",
  warnSoft: "#FFF9E6",
};
const head = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }; // headlines + números
const body = { fontFamily: "'Inter', system-ui, sans-serif" };            // cuerpo
const mono = head; // números usan la misma mono

const STAGES = [
  { id: 1, label: "Prospecto sin trabajar", phase: "Prospección", kind: "hito" },
  { id: 2, label: "Cuenta analizada", phase: "Prospección", kind: "datos" },
  { id: 3, label: "Contacto inicial enviado", phase: "Calificación", kind: "hito" },
  { id: 4, label: "Reunión agendada", phase: "Calificación", kind: "hito" },
  { id: 5, label: "Diagnóstico realizado", phase: "Solución", kind: "datos" },
  { id: 6, label: "Análisis de viabilidad", phase: "Solución", kind: "datos" },
  { id: 7, label: "Propuesta en preparación", phase: "Solución", kind: "datos" },
  { id: 8, label: "Propuesta enviada", phase: "Comercial", kind: "hito" },
  { id: 9, label: "Negociación", phase: "Comercial", kind: "datos" },
  { id: 10, label: "Contrato enviado", phase: "Comercial", kind: "hito" },
  { id: 11, label: "Contrato firmado", phase: "Cierre", kind: "datos" },
];

const PHASE_COLOR = {
  "Prospección": "#8A93A8",
  "Calificación": "#2563EB",
  "Solución": "#6366F1",
  "Comercial": "#0025AE",
  "Cierre": "#16A34A",
};

// Salidas del pipeline (sección 7.1). normal = rango de etapas donde es la salida esperada.
const SALIDAS = [
  { value: "NO_QUALIFY", label: "No califica", normal: [1, 4], exige: null, color: "#8A93A8" },
  { value: "NOT_VIABLE", label: "No viable", normal: [5, 7], exige: null, color: "#B45309" },
  { value: "LOST", label: "Perdido", normal: [3, 10], exige: "motivo", color: "#DC2626" },
  { value: "DEFERRED", label: "Retomar después", normal: [1, 10], exige: "fecha", color: "#6366F1" },
];
const salidaOf = (v) => SALIDAS.find((s) => s.value === v);
const enRangoNormal = (salida, stage) => stage >= salida.normal[0] && stage <= salida.normal[1];
const MOTIVOS_PERDIDA = ["Competencia", "Precio", "Sin presupuesto", "Sin decisión", "Otro"];

const SEGMENTOS = [
  "Cemento y materiales de construcción",
  "Acero y metales",
  "Petróleo y gas",
  "Energía y servicios públicos",
  "Minería",
  "Química y petroquímica",
  "Alimentos y bebidas",
  "Automotriz y autopartes",
];

const TARIFAS = [
  { value: "gdmth", label: "GDMTH — Gran Demanda Media Tensión Horaria" },
  { value: "gdmto", label: "GDMTO — Gran Demanda Media Tensión Ordinaria" },
  { value: "dist", label: "DIST o DIT — Subtransmisión / Transmisión" },
  { value: "gdbt", label: "GDBT — Gran Demanda Baja Tensión" },
  { value: "pdbt", label: "PDBT — Pequeña Demanda Baja Tensión (<25 kW)" },
  { value: "privado", label: "Contrato privado" },
];

const STAGE_FIELDS = {
  2: [
    { key: "segmento", label: "Segmento", type: "select", options: SEGMENTOS },
    { key: "generador", label: "Generador", type: "select", options: ["Mexillum", "Intermepro"] },
    { key: "tipoSistema", label: "Tipo de sistema", type: "select", options: ["SFV", "BESS", "SFV + BESS"] },
    { key: "hipotesisValor", label: "Hipótesis de valor", type: "textarea" },
  ],
  5: [
    { key: "recibosCFE", label: "Recibos CFE recibidos", type: "select", options: ["Sí", "No", "Parcial"] },
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

const STAGE_SUGGESTIONS = {
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
};

const HITO_CRITERIO = {
  1: "Registra la primera investigación o contacto para dejar de ser prospecto sin trabajar.",
  3: "Registra el primer contacto con un interlocutor identificado.",
  4: "Registra la interacción donde el cliente confirmó fecha y hora de reunión.",
  8: "Registra el envío de la propuesta al cliente.",
  10: "Registra el envío de la versión final del contrato para firma.",
};

const INT_TIPOS = [
  { value: "Nota", icon: MessageSquare },
  { value: "Llamada", icon: Phone },
  { value: "Reunión", icon: UsersIcon },
  { value: "Correo", icon: Mail },
];
const intTipo = (v) => INT_TIPOS.find((t) => t.value === v) || INT_TIPOS[0];

const USD_MXN = 18.5;

const seedEmpresas = [
  { id: "e1", nombre: "Cementos del Bajío", segmento: "Cemento y materiales de construcción" },
  { id: "e2", nombre: "Aceros del Norte", segmento: "Acero y metales" },
  { id: "e3", nombre: "Minera San Rafael", segmento: "Minería" },
  { id: "e4", nombre: "Alimentos Vega", segmento: "Alimentos y bebidas" },
];
const seedContactos = [
  { id: "c1", empresaId: "e1", nombre: "Laura Méndez", puesto: "Dir. Planta", email: "laura@cementosbajio.mx", tel: "477 123 4567" },
  { id: "c2", empresaId: "e1", nombre: "Raúl Ibáñez", puesto: "Finanzas", email: "raul@cementosbajio.mx", tel: "477 123 4568" },
  { id: "c3", empresaId: "e2", nombre: "Sofía Duarte", puesto: "Operaciones", email: "sofia@acerosnorte.mx", tel: "81 2233 4455" },
  { id: "c4", empresaId: "e3", nombre: "Dr. Peña", puesto: "Administración", email: "adm@mineranrafael.mx", tel: "55 9988 7766" },
  { id: "c5", empresaId: "e4", nombre: "Mónica Vega", puesto: "Directora", email: "monica@alimentosvega.mx", tel: "33 4455 6677" },
];
const seedIniciativas = [
  { id: "i1", empresaId: "e1", nombre: "SFV techo nave 2", stage: 8, cierre: "2026-10-15",
    accion: "Confirmar recepción de propuesta",
    data: { segmento: "Cemento y materiales de construcción", generador: "Mexillum", tipoSistema: "SFV", capex: 420000, ahorroAnual: 95000, capacidad: "850 kWp", montoPropuesta: 465000 } },
  { id: "i2", empresaId: "e1", nombre: "BESS respaldo línea", stage: 3, cierre: "2026-12-01", accion: "Dar seguimiento", data: {} },
  { id: "i3", empresaId: "e2", nombre: "SFV bombeo riego", stage: 5, cierre: "2026-11-20", accion: "Enviar caso a Ingeniería", data: { tipoSistema: "SFV", tarifa: "gdmto", consumoMensual: 48000 } },
  { id: "i4", empresaId: "e3", nombre: "SFV + BESS crítico", stage: 10, cierre: "2026-09-30", accion: "Dar seguimiento a firma",
    data: { tipoSistema: "SFV + BESS", capex: 780000, ahorroAnual: 150000, capacidad: "1.2 MWp + 500 kWh", montoPropuesta: 830000, montoNegociado: 810000 } },
  { id: "i5", empresaId: "e4", nombre: "SFV azotea CD", stage: 1, cierre: null, accion: "Investigar la empresa", data: {} },
];
const seedTareas = [
  { id: "t1", iniciativaId: "i1", titulo: "Enviar propuesta revisada", fecha: "2026-08-18", done: false },
  { id: "t2", iniciativaId: "i1", titulo: "Llamada de seguimiento", fecha: "2026-08-22", done: false },
  { id: "t3", iniciativaId: "i2", titulo: "Pedir recibos CFE", fecha: "2026-08-19", done: false },
  { id: "t4", iniciativaId: "i3", titulo: "Agendar visita técnica", fecha: "2026-08-25", done: false },
  { id: "t5", iniciativaId: "i4", titulo: "Confirmar firma contrato", fecha: "2026-08-21", done: false },
  { id: "t6", iniciativaId: "i5", titulo: "Investigar consumo estimado", fecha: "2026-08-14", done: true },
];
const seedInteracciones = [
  { id: "n1", iniciativaId: "i1", tipo: "Correo", fecha: "2026-08-12", contactoId: "c1", descripcion: "Envié la propuesta formal con cotización. Confirmó recepción." },
  { id: "n2", iniciativaId: "i1", tipo: "Reunión", fecha: "2026-08-05", contactoId: "c1", descripcion: "Diagnóstico en sitio. Revisamos consumo y espacio de techo." },
  { id: "n3", iniciativaId: "i3", tipo: "Llamada", fecha: "2026-08-10", contactoId: "c3", descripcion: "Pedí recibos CFE de los últimos 12 meses." },
];

const today = new Date("2026-08-20");
const d = (s) => (s ? new Date(s) : null);
const stageOf = (id) => STAGES.find((s) => s.id === id);
const fmtDate = (s) => s ? new Date(s + "T00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—";
const fmtDateLong = (s) => s ? new Date(s + "T00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtUSD = (n) => (n == null || n === "" ? "—" : "$" + Number(n).toLocaleString("en-US"));
const fmtMXN = (n) => (n == null || n === "" ? "—" : "$" + Math.round(Number(n) * USD_MXN).toLocaleString("en-US"));
const paybackOf = (data) => {
  const c = Number(data?.capex), a = Number(data?.ahorroAnual);
  if (!c || !a) return null;
  return (c / a).toFixed(1);
};
const taskStatus = (t) => {
  if (t.done) return "done";
  const f = d(t.fecha);
  if (f && f < today) return "overdue";
  return "upcoming";
};
const uid = () => Math.random().toString(36).slice(2, 9);

// ── UI atoms ──────────────────────────────────────────────────
function StagePill({ stage }) {
  const s = stageOf(stage); const c = PHASE_COLOR[s.phase];
  return (
    <span style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500,
      color: c, background: c + "16", padding: "3px 9px", borderRadius: 8, whiteSpace: "nowrap" }}>
      <span style={{ ...mono, opacity: 0.75 }}>{String(stage).padStart(2, "0")}</span>{s.label}
    </span>
  );
}
function Card({ children, style, ...rest }) {
  return <div {...rest} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, ...style }}>{children}</div>;
}
const linkBtn = { ...body, display: "inline-flex", alignItems: "center", gap: 2, background: "none",
  border: "none", color: C.textSoft, fontSize: 13, cursor: "pointer", fontWeight: 500 };
function Empty({ text }) { return <div style={{ ...body, padding: "18px 4px", color: C.textMute, fontSize: 13.5 }}>{text}</div>; }
const inp = { ...body, width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${C.border}`,
  fontSize: 14, outline: "none", background: C.surface, boxSizing: "border-box", color: C.text };

// ── Menú de acciones (⋯) ──────────────────────────────────────
function ActionMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        style={{ background: open ? C.primarySoft : "none", border: "none", borderRadius: 7, padding: 5, cursor: "pointer", display: "flex", color: C.textMute }}>
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(2,0,98,0.10)", padding: 5, zIndex: 30, minWidth: 140 }}>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} style={menuItem}><Pencil size={14} /> Editar</button>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} style={{ ...menuItem, color: C.danger }}><Trash2 size={14} /> Borrar</button>
        </div>
      )}
    </div>
  );
}
const menuItem = { ...body, display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px",
  background: "none", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13.5, fontWeight: 500, color: C.text, textAlign: "left" };

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("dash");
  const [empresas, setEmpresas] = useState(seedEmpresas);
  const [contactos, setContactos] = useState(seedContactos);
  const [iniciativas, setIniciativas] = useState(seedIniciativas);
  const [tareas, setTareas] = useState(seedTareas);
  const [interacciones, setInteracciones] = useState(seedInteracciones);
  const [sel, setSel] = useState(null);
  const [selEmp, setSelEmp] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [salidaModal, setSalidaModal] = useState(null); // iniciativa

  const empresaName = (id) => empresas.find((e) => e.id === id)?.nombre || "—";

  const toggleTask = (id) => setTareas((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = (iniId, titulo, fecha) => setTareas((ts) => [...ts, { id: uid(), iniciativaId: iniId, titulo, fecha, done: false }]);
  const updateTask = (id, patch) => setTareas((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t));
  const deleteTask = (id) => setTareas((ts) => ts.filter((t) => t.id !== id));

  const updateData = (iniId, patch) => setIniciativas((is) => is.map((i) => i.id === iniId ? { ...i, data: { ...i.data, ...patch } } : i));
  const advanceStage = (iniId) => setIniciativas((is) => is.map((i) => i.id === iniId ? { ...i, stage: Math.min(11, i.stage + 1) } : i));
  const updateLead = (id, patch) => setIniciativas((is) => is.map((i) => i.id === id ? { ...i, ...patch } : i));
  const marcarSalida = (id, salida) => setIniciativas((is) => is.map((i) => i.id === id ? { ...i, salida } : i));
  const reabrirLead = (id) => setIniciativas((is) => is.map((i) => i.id === id ? { ...i, salida: null } : i));
  const deleteLead = (id) => {
    setIniciativas((is) => is.filter((i) => i.id !== id));
    setTareas((ts) => ts.filter((t) => t.iniciativaId !== id));
    setInteracciones((ns) => ns.filter((n) => n.iniciativaId !== id));
  };
  const addLead = (empresaId, nombre) => {
    const id = uid();
    setIniciativas((is) => [...is, { id, empresaId, nombre, stage: 1, cierre: null, accion: STAGE_SUGGESTIONS[1][0], data: {} }]);
    return id;
  };

  const addInteraccion = (iniId, { tipo, fecha, contactoId, descripcion }, { avanzar, nuevaAccion } = {}) => {
    setInteracciones((ns) => [...ns, { id: uid(), iniciativaId: iniId, tipo, fecha, contactoId: contactoId || null, descripcion }]);
    setIniciativas((is) => is.map((i) => {
      if (i.id !== iniId) return i;
      let next = { ...i };
      if (nuevaAccion != null && nuevaAccion !== "") next.accion = nuevaAccion;
      if (avanzar) next.stage = Math.min(11, i.stage + 1);
      return next;
    }));
  };
  const deleteInteraccion = (id) => setInteracciones((ns) => ns.filter((n) => n.id !== id));

  const addEmpresa = (nombre, segmento) => { const id = uid(); setEmpresas((e) => [...e, { id, nombre, segmento }]); return id; };
  const updateEmpresa = (id, patch) => setEmpresas((es) => es.map((e) => e.id === id ? { ...e, ...patch } : e));
  const deleteEmpresa = (id) => {
    setEmpresas((es) => es.filter((e) => e.id !== id));
    const iniIds = iniciativas.filter((i) => i.empresaId === id).map((i) => i.id);
    setIniciativas((is) => is.filter((i) => i.empresaId !== id));
    setContactos((cs) => cs.filter((c) => c.empresaId !== id));
    setTareas((ts) => ts.filter((t) => !iniIds.includes(t.iniciativaId)));
    setInteracciones((ns) => ns.filter((n) => !iniIds.includes(n.iniciativaId)));
  };

  const addContacto = (c) => setContactos((cs) => [...cs, { id: uid(), ...c }]);
  const updateContacto = (id, patch) => setContactos((cs) => cs.map((c) => c.id === id ? { ...c, ...patch } : c));
  const deleteContacto = (id) => setContactos((cs) => cs.filter((c) => c.id !== id));

  const askDeleteLead = (i) => setConfirm({ title: "Borrar lead", body: `Se eliminará "${i.nombre}", sus acciones e interacciones. No se puede deshacer.`,
    onConfirm: () => { deleteLead(i.id); if (sel === i.id) setSel(null); } });
  const askDeleteEmpresa = (e) => {
    const nIni = iniciativas.filter((i) => i.empresaId === e.id).length;
    const nCon = contactos.filter((c) => c.empresaId === e.id).length;
    setConfirm({ title: "Borrar empresa", body: `Se eliminará "${e.nombre}"${nIni || nCon ? ` junto con ${nIni} proyecto(s) y ${nCon} contacto(s)` : ""}. No se puede deshacer.`,
      onConfirm: () => deleteEmpresa(e.id) });
  };
  const askDeleteContacto = (c) => setConfirm({ title: "Borrar contacto", body: `Se eliminará a "${c.nombre}". No se puede deshacer.`, onConfirm: () => deleteContacto(c.id) });

  const nav = [
    { id: "dash", label: "Panel", icon: LayoutDashboard },
    { id: "leads", label: "Leads", icon: Target },
    { id: "acciones", label: "Acciones", icon: CheckSquare },
    { id: "empresas", label: "Empresas", icon: Building2 },
    { id: "contactos", label: "Contactos", icon: Users },
  ];

  const selIni = iniciativas.find((i) => i.id === sel);

  return (
    <div style={{ ...body, display: "flex", minHeight: "100vh", background: C.bg, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <aside style={{ width: 220, background: C.text, color: "#fff", padding: "22px 14px",
        position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px 24px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primary, display: "grid", placeItems: "center", flexShrink: 0 }} />
          <div style={{ ...head, fontWeight: 600, fontSize: 15, letterSpacing: -0.3 }}>
            CRM
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {nav.map((n) => {
            const active = view === n.id && !sel && !selEmp; const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => { setView(n.id); setSel(null); setSelEmp(null); }}
                style={{ ...body, display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 9,
                  border: "none", background: active ? "rgba(255,255,255,0.10)" : "transparent", color: active ? "#fff" : "#9AA2C9",
                  cursor: "pointer", fontSize: 14, fontWeight: 500, textAlign: "left", width: "100%" }}>
                <Icon size={17} strokeWidth={2} color={active ? C.primary : "#6b74a6"} />{n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: "0 8px", fontSize: 12, color: "#5b639a" }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14 }}>Cris</div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "26px 34px", maxWidth: 1080, margin: "0 auto", width: "100%" }}>
        {selIni ? (
          <LeadDetail
            ini={selIni} empresaName={empresaName} contactos={contactos} tareas={tareas} interacciones={interacciones}
            onBack={() => setSel(null)} onToggleTask={toggleTask} onAdvance={advanceStage}
            onUpdateData={updateData} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask}
            onAddInteraccion={addInteraccion} onDeleteInteraccion={deleteInteraccion}
            onEditLead={() => setModal({ type: "lead", entity: selIni })} onDeleteLead={() => askDeleteLead(selIni)}
            onMarcarSalida={() => setSalidaModal(selIni)} onReabrir={() => reabrirLead(selIni.id)}
            onOpenEmpresa={() => { setSel(null); setSelEmp(selIni.empresaId); }}
          />
        ) : selEmp ? (
          <EmpresaDetail
            empresa={empresas.find((e) => e.id === selEmp)} iniciativas={iniciativas} contactos={contactos} interacciones={interacciones}
            onBack={() => setSelEmp(null)} onOpenLead={(id) => { setSelEmp(null); setSel(id); }}
            onEditEmpresa={(e) => setModal({ type: "empresa", entity: e })}
            onNewLead={() => setModal({ type: "lead", empresaId: selEmp })}
            onNewContacto={() => setModal({ type: "contacto", empresaId: selEmp })}
            onEditContacto={(c) => setModal({ type: "contacto", entity: c })} onDeleteContacto={askDeleteContacto}
          />
        ) : (
          <>
            {view === "dash" && <Dashboard {...{ iniciativas, tareas, interacciones, empresaName, setSel, setView }} />}
            {view === "leads" && <Leads {...{ iniciativas, empresaName, setSel, onNew: () => setModal({ type: "lead" }), onEdit: (i) => setModal({ type: "lead", entity: i }), onDelete: askDeleteLead }} />}
            {view === "acciones" && <Acciones {...{ tareas, iniciativas, empresaName, onToggle: toggleTask, setSel }} />}
            {view === "empresas" && <Empresas {...{ empresas, iniciativas, contactos, onOpen: setSelEmp, onNew: () => setModal({ type: "empresa" }), onEdit: (e) => setModal({ type: "empresa", entity: e }), onDelete: askDeleteEmpresa }} />}
            {view === "contactos" && <Contactos {...{ contactos, empresaName, onNew: () => setModal({ type: "contacto" }), onEdit: (c) => setModal({ type: "contacto", entity: c }), onDelete: askDeleteContacto }} />}
          </>
        )}
      </main>

      {modal && (
        <FormModal modal={modal} empresas={empresas} onClose={() => setModal(null)}
          onSubmit={(payload) => {
            const editing = modal.entity;
            if (modal.type === "empresa") { if (editing) updateEmpresa(editing.id, { nombre: payload.nombre, segmento: payload.segmento }); else addEmpresa(payload.nombre, payload.segmento); }
            if (modal.type === "contacto") { if (editing) updateContacto(editing.id, payload); else addContacto(payload); }
            if (modal.type === "lead") {
              if (editing) updateLead(editing.id, { nombre: payload.nombre, empresaId: payload.empresaId || editing.empresaId, cierre: payload.cierre ?? editing.cierre });
              else { let eid = payload.empresaId; if (payload.nuevaEmpresa) eid = addEmpresa(payload.nuevaEmpresa, payload.segmento || ""); const id = addLead(eid, payload.nombre); setModal(null); setSel(id); return; }
            }
            setModal(null);
          }} />
      )}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} onConfirm={() => { confirm.onConfirm(); setConfirm(null); }} />}
      {salidaModal && (
        <SalidaModal ini={salidaModal} onClose={() => setSalidaModal(null)}
          onSubmit={(salida) => { marcarSalida(salidaModal.id, salida); setSalidaModal(null); }} />
      )}
    </div>
  );
}

// ── PageHead + AddBtn ─────────────────────────────────────────
function PageHead({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <h1 style={{ ...head, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: C.text }}>{title}</h1>
        {sub && <p style={{ ...body, margin: "6px 0 0", color: C.textSoft, fontSize: 14 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
function AddBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 7, background: C.primary,
      color: "#fff", border: "none", padding: "9px 15px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
      <Plus size={16} /> {label}
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
function Dashboard({ iniciativas, tareas, interacciones, empresaName, setSel, setView }) {
  const iniOf = (id) => iniciativas.find((i) => i.id === id);
  const abiertos = iniciativas.filter((i) => !i.salida);
  const activos = abiertos.filter((i) => i.stage < 11); // sin cierre ganado

  const overdue = tareas.filter((t) => taskStatus(t) === "overdue" && !iniOf(t.iniciativaId)?.salida);
  const upcoming = tareas.filter((t) => taskStatus(t) === "upcoming" && !iniOf(t.iniciativaId)?.salida)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 6);

  // valor del pipeline (abiertos, sin cierre ganado)
  const montoDe = (i) => Number(i.data?.montoNegociado || i.data?.montoPropuesta || i.data?.capex || 0);
  const valorPipeline = activos.reduce((s, i) => s + montoDe(i), 0);
  const ganado = iniciativas.filter((i) => i.stage === 11 && !i.salida).reduce((s, i) => s + Number(i.data?.montoFinal || montoDe(i)), 0);

  // embudo: leads y monto por etapa (solo abiertos)
  const embudo = STAGES.map((st) => {
    const items = abiertos.filter((i) => i.stage === st.id);
    return { st, n: items.length, monto: items.reduce((s, i) => s + montoDe(i), 0) };
  });
  const maxN = Math.max(1, ...embudo.map((e) => e.n));

  // a retomar: DEFERRED con fecha vencida o próxima
  const aRetomar = iniciativas.filter((i) => i.salida?.value === "DEFERRED")
    .sort((a, b) => new Date(a.salida.fechaRetomar || "9999") - new Date(b.salida.fechaRetomar || "9999"));

  // se enfría: abiertos activos cuya última interacción es > 14 días (o nunca)
  const ultimaInteraccion = (id) => {
    const ns = interacciones.filter((n) => n.iniciativaId === id);
    if (!ns.length) return null;
    return ns.reduce((max, n) => new Date(n.fecha) > new Date(max) ? n.fecha : max, ns[0].fecha);
  };
  const diasDesde = (f) => f ? Math.floor((today - new Date(f + "T00:00")) / 86400000) : null;
  const enfriando = activos.map((i) => ({ i, ultima: ultimaInteraccion(i.id) }))
    .map((x) => ({ ...x, dias: diasDesde(x.ultima) }))
    .filter((x) => x.dias === null || x.dias >= 14)
    .sort((a, b) => (b.dias ?? 9999) - (a.dias ?? 9999)).slice(0, 5);

  const kpis = [
    { label: "Por hacer hoy", value: overdue.length + upcoming.length, color: C.text, sub: `${overdue.length} vencidas` },
    { label: "Leads activos", value: activos.length, color: C.primary },
    { label: "Valor del pipeline", value: fmtUSD(valorPipeline), color: C.accent, small: true },
    { label: "A retomar", value: aRetomar.length, color: "#6366F1" },
  ];

  return (
    <>
      <PageHead title="Panel" sub="Miércoles 20 de agosto, 2026" />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {kpis.map((k) => (
          <Card key={k.label} style={{ padding: "16px 18px" }}>
            <div style={{ ...body, fontSize: 12.5, color: C.textSoft, fontWeight: 500, marginBottom: 10 }}>{k.label}</div>
            <div style={{ ...mono, fontSize: k.small ? 22 : 32, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
            {k.sub && <div style={{ ...body, fontSize: 12, color: C.textMute, marginTop: 6 }}>{k.sub}</div>}
          </Card>
        ))}
      </div>

      {/* 1 · HOY */}
      <SectionTitle>Hoy</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 26 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ ...head, margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.text }}>
              <AlertCircle size={16} color={C.danger} /> Vencidas
            </h3>
            <button onClick={() => setView("acciones")} style={linkBtn}>Ver todas <ChevronRight size={14} /></button>
          </div>
          {overdue.length === 0 && <Empty text="Nada vencido. Vas al día." />}
          {overdue.map((t) => { const ini = iniOf(t.iniciativaId); return <TaskRow key={t.id} t={t} sub={`${empresaName(ini?.empresaId)} · ${ini?.nombre}`} onClick={() => setSel(ini?.id)} />; })}
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ ...head, margin: 0, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.text }}>
              <Clock size={16} color={C.primary} /> Próximas
            </h3>
            <button onClick={() => setView("acciones")} style={linkBtn}>Ver todas <ChevronRight size={14} /></button>
          </div>
          {upcoming.length === 0 && <Empty text="Sin próximas acciones." />}
          {upcoming.map((t) => { const ini = iniOf(t.iniciativaId); return <TaskRow key={t.id} t={t} sub={`${empresaName(ini?.empresaId)} · ${ini?.nombre}`} onClick={() => setSel(ini?.id)} />; })}
        </Card>
      </div>

      {/* 2 · PIPELINE */}
      <SectionTitle>Pipeline</SectionTitle>
      <Card style={{ padding: 20, marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ ...body, fontSize: 12.5, color: C.textSoft, marginBottom: 4 }}>Valor en pipeline (activos)</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: C.text }}>{fmtUSD(valorPipeline)}</div>
            <div style={{ ...mono, fontSize: 12, color: C.textMute }}>≈ {fmtMXN(valorPipeline)} MXN</div>
          </div>
          <div>
            <div style={{ ...body, fontSize: 12.5, color: C.textSoft, marginBottom: 4 }}>Ganado (firmado)</div>
            <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: C.success }}>{fmtUSD(ganado)}</div>
          </div>
        </div>
        {/* embudo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {embudo.map(({ st, n, monto }) => {
            const c = PHASE_COLOR[st.phase];
            const w = (n / maxN) * 100;
            return (
              <div key={st.id} onClick={() => n && setView("leads")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: n ? "pointer" : "default", padding: "2px 0" }}>
                <div style={{ ...mono, fontSize: 11, color: C.textMute, width: 20, flexShrink: 0, textAlign: "right" }}>{String(st.id).padStart(2, "0")}</div>
                <div style={{ ...body, fontSize: 12.5, color: C.textSoft, width: 150, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.label}</div>
                <div style={{ flex: 1, background: "#F1F4F9", borderRadius: 6, height: 22, position: "relative", overflow: "hidden" }}>
                  <div style={{ width: `${w}%`, minWidth: n ? 26 : 0, height: "100%", background: c + "22", borderRadius: 6, transition: "width .3s" }} />
                  {n > 0 && <span style={{ ...mono, position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: c }}>{n}</span>}
                </div>
                <div style={{ ...mono, fontSize: 12, color: monto ? C.textSoft : C.textMute, width: 90, flexShrink: 0, textAlign: "right" }}>{monto ? fmtUSD(monto) : "—"}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3 · SE ENFRÍA / A RETOMAR */}
      <SectionTitle>Requiere atención</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card style={{ padding: 18 }}>
          <h3 style={{ ...head, margin: "0 0 4px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.text }}>
            <Clock size={16} color="#B45309" /> Se está enfriando
          </h3>
          <p style={{ ...body, fontSize: 12, color: C.textMute, margin: "0 0 12px" }}>Activos sin interacción en 14+ días</p>
          {enfriando.length === 0 && <Empty text="Todo con seguimiento reciente." />}
          {enfriando.map(({ i, dias }) => (
            <div key={i.id} onClick={() => setSel(i.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...body, fontSize: 14, fontWeight: 500, color: C.text }}>{i.nombre}</div>
                <div style={{ ...body, fontSize: 12.5, color: C.textMute }}>{empresaName(i.empresaId)}</div>
              </div>
              <StagePill stage={i.stage} />
              <span style={{ ...mono, fontSize: 12, color: "#B45309", fontWeight: 600, whiteSpace: "nowrap" }}>{dias === null ? "sin activ." : `${dias}d`}</span>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 18 }}>
          <h3 style={{ ...head, margin: "0 0 4px", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.text }}>
            <RotateCcw size={16} color="#6366F1" /> A retomar
          </h3>
          <p style={{ ...body, fontSize: 12, color: C.textMute, margin: "0 0 12px" }}>Leads diferidos con fecha</p>
          {aRetomar.length === 0 && <Empty text="Ninguno pendiente de retomar." />}
          {aRetomar.map((i) => {
            const venc = i.salida.fechaRetomar && new Date(i.salida.fechaRetomar + "T00:00") <= today;
            return (
              <div key={i.id} onClick={() => setSel(i.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...body, fontSize: 14, fontWeight: 500, color: C.text }}>{i.nombre}</div>
                  <div style={{ ...body, fontSize: 12.5, color: C.textMute }}>{empresaName(i.empresaId)}</div>
                </div>
                <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: venc ? C.danger : C.textMute, whiteSpace: "nowrap" }}>{fmtDate(i.salida.fechaRetomar)}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </>
  );
}

function SectionTitle({ children }) {
  return <h2 style={{ ...head, fontSize: 13, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 12px" }}>{children}</h2>;
}

function TaskRow({ t, sub, onClick, showCheck, onToggle, onEdit, onDelete }) {
  const st = taskStatus(t);
  const dot = st === "overdue" ? C.danger : st === "done" ? C.success : C.primary;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default" }}>
      {showCheck ? (
        <button onClick={(e) => { e.stopPropagation(); onToggle(t.id); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}>
          {t.done ? <CheckCircle2 size={18} color={C.success} /> : <Circle size={18} color="#C4CBDA" />}
        </button>
      ) : (
        <span style={{ width: 7, height: 7, borderRadius: 999, background: dot, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...body, fontSize: 14, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.textMute : C.text }}>{t.titulo}</div>
        {sub && <div style={{ ...body, fontSize: 12.5, color: C.textMute, marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ ...mono, fontSize: 12.5, color: st === "overdue" ? C.danger : C.textMute, fontWeight: 500 }}>{fmtDate(t.fecha)}</span>
      {(onEdit || onDelete) && <ActionMenu onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

// ── Badge de salida ───────────────────────────────────────────
function SalidaBadge({ salida }) {
  const def = salidaOf(salida.value);
  return (
    <span style={{ ...body, display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
      color: def.color, background: def.color + "14", padding: "3px 9px", borderRadius: 8, whiteSpace: "nowrap" }}>
      {def.label}{salida.excepcional && <span title="Salida excepcional" style={{ ...mono, fontSize: 10, opacity: 0.7 }}>excep.</span>}
    </span>
  );
}

// ── Leads ─────────────────────────────────────────────────────
function Leads({ iniciativas, empresaName, setSel, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("abiertos"); // abiertos | salidas | todos
  const base = iniciativas.filter((i) =>
    filtro === "abiertos" ? !i.salida : filtro === "salidas" ? !!i.salida : true
  );
  const rows = base.filter((i) => (empresaName(i.empresaId) + i.nombre).toLowerCase().includes(q.toLowerCase()));
  const nAbiertos = iniciativas.filter((i) => !i.salida).length;
  const nSalidas = iniciativas.filter((i) => !!i.salida).length;
  const tabs = [
    { id: "abiertos", label: "Abiertos", n: nAbiertos },
    { id: "salidas", label: "Salidas", n: nSalidas },
    { id: "todos", label: "Todos", n: iniciativas.length },
  ];
  return (
    <>
      <PageHead title="Leads" sub="Una empresa puede tener varios proyectos" action={<AddBtn label="Nuevo lead" onClick={onNew} />} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "#EEF1F7", padding: 3, borderRadius: 10 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setFiltro(t.id)} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filtro === t.id ? C.surface : "transparent", color: filtro === t.id ? C.text : C.textMute,
              boxShadow: filtro === t.id ? "0 1px 2px rgba(2,0,98,0.08)" : "none" }}>
              {t.label}<span style={{ ...mono, fontSize: 11.5, color: filtro === t.id ? C.primary : C.textMute }}>{t.n}</span>
            </button>
          ))}
        </div>
        <SearchBar q={q} setQ={setQ} placeholder="Buscar por empresa o proyecto…" noMargin />
      </div>
      <Card style={{ overflow: "visible" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ ...body, background: "#FAFBFD", color: C.textMute, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Th>Empresa</Th><Th>Proyecto</Th><Th>Etapa / Estado</Th><Th>Próxima acción</Th><Th right>Monto</Th><Th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ ...body, padding: "22px 16px", color: C.textMute, fontSize: 13.5 }}>Sin leads en esta vista.</td></tr>
            )}
            {rows.map((i) => {
              const monto = i.data?.montoNegociado || i.data?.montoPropuesta || i.data?.capex;
              const cerrado = !!i.salida;
              return (
                <tr key={i.id} onClick={() => setSel(i.id)} style={{ cursor: "pointer", borderTop: `1px solid ${C.border}`, opacity: cerrado ? 0.72 : 1 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFD")} onMouseLeave={(e) => (e.currentTarget.style.background = C.surface)}>
                  <Td><span style={{ ...body, fontWeight: 600, color: C.text }}>{empresaName(i.empresaId)}</span></Td>
                  <Td><span style={{ ...body, color: C.textSoft }}>{i.nombre}</span></Td>
                  <Td>{cerrado ? <SalidaBadge salida={i.salida} /> : <StagePill stage={i.stage} />}</Td>
                  <Td><span style={{ ...body, color: C.textSoft, fontSize: 13 }}>{cerrado ? "—" : (i.accion || "—")}</span></Td>
                  <Td right><span style={mono}>{fmtUSD(monto)}</span></Td>
                  <Td right><ActionMenu onEdit={() => onEdit(i)} onDelete={() => onDelete(i)} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
const Th = ({ children, right }) => <th style={{ textAlign: right ? "right" : "left", padding: "11px 16px", fontWeight: 600 }}>{children}</th>;
const Td = ({ children, right }) => <td style={{ textAlign: right ? "right" : "left", padding: "13px 16px", verticalAlign: "middle" }}>{children}</td>;

function SearchBar({ q, setQ, placeholder, noMargin }) {
  return (
    <div style={{ position: "relative", marginBottom: noMargin ? 0 : 14, width: 300, maxWidth: "100%" }}>
      <Search size={16} color={C.textMute} style={{ position: "absolute", left: 12, top: 11 }} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} style={{ ...inp, paddingLeft: 34 }} />
    </div>
  );
}

// ── Acciones ──────────────────────────────────────────────────
function Acciones({ tareas, iniciativas, empresaName, onToggle, setSel }) {
  const iniOf = (id) => iniciativas.find((i) => i.id === id);
  const groups = [
    { key: "overdue", label: "Vencidas", color: C.danger },
    { key: "upcoming", label: "Próximas", color: C.primary },
    { key: "done", label: "Completadas", color: C.success },
  ];
  return (
    <>
      <PageHead title="Acciones" sub="Tus pendientes en todos los leads" />
      {groups.map((g) => {
        const items = tareas.filter((t) => taskStatus(t) === g.key);
        if (!items.length) return null;
        return (
          <div key={g.key} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: g.color }} />
              <span style={{ ...body, fontSize: 13, fontWeight: 600, color: C.textSoft }}>{g.label}</span>
              <span style={{ ...mono, fontSize: 12.5, color: C.textMute }}>{items.length}</span>
            </div>
            <Card style={{ padding: "4px 18px" }}>
              {items.map((t) => { const ini = iniOf(t.iniciativaId); return <TaskRow key={t.id} t={t} showCheck onToggle={onToggle} sub={`${empresaName(ini?.empresaId)} · ${ini?.nombre}`} onClick={() => setSel(ini?.id)} />; })}
            </Card>
          </div>
        );
      })}
    </>
  );
}

// ── Empresas ──────────────────────────────────────────────────
function Empresas({ empresas, iniciativas, contactos, onOpen, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState("");
  const rows = empresas.filter((e) => e.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="Empresas" sub={`${empresas.length} cuentas`} action={<AddBtn label="Nueva empresa" onClick={onNew} />} />
      <SearchBar q={q} setQ={setQ} placeholder="Buscar empresa…" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {rows.map((e) => {
          const nIni = iniciativas.filter((i) => i.empresaId === e.id).length;
          const nCon = contactos.filter((c) => c.empresaId === e.id).length;
          return (
            <Card key={e.id} style={{ padding: 18, cursor: "pointer", transition: "border-color .12s" }}
              onClick={() => onOpen(e.id)}
              onMouseEnter={(ev) => (ev.currentTarget.style.borderColor = C.primary + "66")}
              onMouseLeave={(ev) => (ev.currentTarget.style.borderColor = C.border)}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Building2 size={19} color={C.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...body, fontWeight: 600, fontSize: 15.5, color: C.text }}>{e.nombre}</div>
                  <div style={{ ...body, fontSize: 12.5, color: C.textMute }}>{e.segmento || "—"}</div>
                </div>
                <ActionMenu onEdit={() => onEdit(e)} onDelete={() => onDelete(e)} />
              </div>
              <div style={{ display: "flex", gap: 22, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                <Stat n={nIni} label="proyectos" /><Stat n={nCon} label="contactos" />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
function Stat({ n, label }) {
  return (<div><span style={{ ...mono, fontSize: 18, fontWeight: 700, marginRight: 6, color: C.text }}>{n}</span>
    <span style={{ ...body, fontSize: 13, color: C.textMute }}>{label}</span></div>);
}

// ── Empresa detail (ficha de cuenta) ──────────────────────────
function EmpresaDetail({ empresa, iniciativas, contactos, interacciones, onBack, onOpenLead, onEditEmpresa, onNewLead, onNewContacto, onEditContacto, onDeleteContacto }) {
  if (!empresa) return null;
  const proyectos = iniciativas.filter((i) => i.empresaId === empresa.id);
  const cons = contactos.filter((c) => c.empresaId === empresa.id);
  const proyIds = proyectos.map((p) => p.id);
  const ints = interacciones.filter((n) => proyIds.includes(n.iniciativaId)).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const montoDe = (i) => Number(i.data?.montoNegociado || i.data?.montoPropuesta || i.data?.capex || 0);
  const abiertos = proyectos.filter((p) => !p.salida && p.stage < 11);
  const ganados = proyectos.filter((p) => p.stage === 11 && !p.salida);
  const cerrados = proyectos.filter((p) => p.salida);
  const valorAbierto = abiertos.reduce((s, p) => s + montoDe(p), 0);
  const valorGanado = ganados.reduce((s, p) => s + Number(p.data?.montoFinal || montoDe(p)), 0);

  const proyDe = (id) => proyectos.find((p) => p.id === id);

  return (
    <>
      <button onClick={onBack} style={{ ...linkBtn, marginBottom: 16 }}><ChevronRight size={15} style={{ transform: "scaleX(-1)" }} /> Volver</button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Building2 size={23} color={C.primary} />
          </div>
          <div>
            <h1 style={{ ...head, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: C.text }}>{empresa.nombre}</h1>
            <div style={{ ...body, fontSize: 13.5, color: C.textMute, marginTop: 3 }}>{empresa.segmento || "Sin segmento"}</div>
          </div>
        </div>
        <button onClick={() => onEditEmpresa(empresa)} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.textSoft, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Pencil size={14} /> Editar</button>
      </div>

      {/* resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Proyectos", value: proyectos.length, color: C.text },
          { label: "Abiertos", value: abiertos.length, color: C.primary },
          { label: "Valor abierto", value: fmtUSD(valorAbierto), color: C.accent, small: true },
          { label: "Ganado", value: fmtUSD(valorGanado), color: C.success, small: true },
        ].map((k) => (
          <Card key={k.label} style={{ padding: "14px 16px" }}>
            <div style={{ ...body, fontSize: 12, color: C.textSoft, fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ ...mono, fontSize: k.small ? 18 : 26, fontWeight: 700, color: k.color, lineHeight: 1 }}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* proyectos */}
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ ...head, margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Proyectos</h3>
              <button onClick={onNewLead} style={{ ...linkBtn, color: C.primary }}><Plus size={14} /> Nuevo</button>
            </div>
            {proyectos.length === 0 && <Empty text="Sin proyectos aún." />}
            {proyectos.map((p) => {
              const cerrado = !!p.salida; const monto = montoDe(p);
              return (
                <div key={p.id} onClick={() => onOpenLead(p.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer", opacity: cerrado ? 0.72 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...body, fontSize: 14, fontWeight: 600, color: C.text }}>{p.nombre}</div>
                    <div style={{ marginTop: 4 }}>{cerrado ? <SalidaBadge salida={p.salida} /> : <StagePill stage={p.stage} />}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 13, color: monto ? C.textSoft : C.textMute }}>{fmtUSD(monto)}</span>
                  <ChevronRight size={16} color="#C4CBDA" />
                </div>
              );
            })}
          </Card>

          {/* interacciones de todos los proyectos */}
          <Card style={{ padding: 18 }}>
            <h3 style={{ ...head, margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>Historial de interacciones</h3>
            {ints.length === 0 && <Empty text="Sin interacciones en ningún proyecto." />}
            {ints.map((n) => {
              const T = intTipo(n.tipo); const Icon = T.icon;
              const contacto = contactos.find((c) => c.id === n.contactoId);
              const proy = proyDe(n.iniciativaId);
              return (
                <div key={n.id} style={{ display: "flex", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={15} color={C.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ ...body, fontSize: 13.5, fontWeight: 600, color: C.text }}>{n.tipo}</span>
                      {proy && <span onClick={() => onOpenLead(proy.id)} style={{ ...body, fontSize: 12, color: C.primary, cursor: "pointer", fontWeight: 500 }}>{proy.nombre}</span>}
                      {contacto && <span style={{ ...body, fontSize: 12.5, color: C.textMute }}>· {contacto.nombre}</span>}
                      <span style={{ ...mono, fontSize: 11.5, color: C.textMute, marginLeft: "auto" }}>{fmtDateLong(n.fecha)}</span>
                    </div>
                    {n.descripcion && <div style={{ ...body, fontSize: 13, color: C.textSoft, marginTop: 3, lineHeight: 1.45 }}>{n.descripcion}</div>}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* contactos */}
        <Card style={{ padding: 18, alignSelf: "start" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ ...head, margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Contactos</h3>
            <button onClick={onNewContacto} style={{ ...linkBtn, color: C.primary }}><Plus size={14} /> Nuevo</button>
          </div>
          {cons.length === 0 && <Empty text="Sin contactos aún." />}
          {cons.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={c.nombre} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...body, fontSize: 14, fontWeight: 500, color: C.text }}>{c.nombre}</div>
                <div style={{ ...body, fontSize: 12.5, color: C.textMute }}>{c.puesto || "—"}</div>
                <div style={{ ...body, fontSize: 12.5, color: C.textSoft, marginTop: 2 }}>
                  {c.email && <span>{c.email}</span>}{c.email && c.tel && " · "}{c.tel && <span style={mono}>{c.tel}</span>}
                </div>
              </div>
              <ActionMenu onEdit={() => onEditContacto(c)} onDelete={() => onDeleteContacto(c)} />
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

// ── Contactos ─────────────────────────────────────────────────
function Contactos({ contactos, empresaName, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState("");
  const rows = contactos.filter((c) => (c.nombre + empresaName(c.empresaId)).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="Contactos" sub={`${contactos.length} personas`} action={<AddBtn label="Nuevo contacto" onClick={onNew} />} />
      <SearchBar q={q} setQ={setQ} placeholder="Buscar contacto o empresa…" />
      <Card style={{ overflow: "visible" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ ...body, background: "#FAFBFD", color: C.textMute, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Th>Nombre</Th><Th>Empresa</Th><Th>Puesto</Th><Th>Correo</Th><Th right>Teléfono</Th><Th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={c.nombre} /><span style={{ ...body, fontWeight: 600, color: C.text }}>{c.nombre}</span></div></Td>
                <Td><span style={{ ...body, color: C.textSoft }}>{empresaName(c.empresaId)}</span></Td>
                <Td><span style={{ ...body, color: C.textMute }}>{c.puesto}</span></Td>
                <Td><span style={{ ...body, color: C.textSoft }}>{c.email}</span></Td>
                <Td right><span style={mono}>{c.tel}</span></Td>
                <Td right><ActionMenu onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
function Avatar({ name }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (<div style={{ ...head, width: 30, height: 30, borderRadius: 999, background: C.primarySoft, color: C.primary,
    display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>);
}

// ── Lead detail (ficha) ───────────────────────────────────────
function LeadDetail({ ini, empresaName, contactos, tareas, interacciones, onBack, onToggleTask, onAdvance,
  onUpdateData, onAddTask, onUpdateTask, onDeleteTask, onAddInteraccion, onDeleteInteraccion, onEditLead, onDeleteLead,
  onMarcarSalida, onReabrir, onOpenEmpresa }) {
  const [warn, setWarn] = useState("");
  if (!ini) return null;

  const s = stageOf(ini.stage);
  const esHito = s.kind === "hito";
  const cerrado = !!ini.salida;
  const cons = contactos.filter((c) => c.empresaId === ini.empresaId);
  const tks = tareas.filter((t) => t.iniciativaId === ini.id);
  const ints = interacciones.filter((n) => n.iniciativaId === ini.id).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const payback = paybackOf(ini.data);

  const currentRequired = (STAGE_FIELDS[ini.stage] || []).filter((f) => f.required);
  const missing = currentRequired.filter((f) => { const v = ini.data?.[f.key]; return v == null || v === ""; });
  const tryAdvance = () => {
    if (missing.length) { setWarn(`Para avanzar necesitas: ${missing.map((m) => m.label).join(", ")}`); return; }
    setWarn(""); onAdvance(ini.id);
  };

  return (
    <>
      <button onClick={onBack} style={{ ...linkBtn, marginBottom: 16 }}><ChevronRight size={15} style={{ transform: "scaleX(-1)" }} /> Volver</button>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div onClick={onOpenEmpresa} style={{ ...body, fontSize: 13, color: C.primary, fontWeight: 600, marginBottom: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
            {empresaName(ini.empresaId)} <ChevronRight size={13} />
          </div>
          <h1 style={{ ...head, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: C.text }}>{ini.nombre}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onEditLead} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.textSoft, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Pencil size={14} /> Editar</button>
          {cerrado ? (
            <button onClick={onReabrir} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.primary, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><RotateCcw size={14} /> Reabrir</button>
          ) : ini.stage < 11 ? (
            <button onClick={onMarcarSalida} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, color: C.textSoft, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><LogOut size={14} /> Marcar salida</button>
          ) : null}
          <button onClick={onDeleteLead} style={{ ...body, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.dangerSoft}`, color: C.danger, padding: "9px 13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Trash2 size={14} /> Borrar</button>
        </div>
      </div>

      <div style={{ margin: "14px 0 12px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <StagePill stage={ini.stage} />
        {cerrado ? (
          <SalidaBadge salida={ini.salida} />
        ) : (
          <span style={{ ...body, fontSize: 12, color: C.textMute, fontWeight: 500, background: "#EEF1F7", padding: "3px 9px", borderRadius: 8 }}>
            {esHito ? "Hito — avanza al registrar interacción" : "Datos — captura y avanza"}
          </span>
        )}
      </div>

      {cerrado && (
        <div style={{ ...body, background: salidaOf(ini.salida.value).color + "0F", border: `1px solid ${salidaOf(ini.salida.value).color}33`,
          borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ini.salida.motivo || ini.salida.fechaRetomar || ini.salida.nota ? 8 : 0 }}>
            <LogOut size={16} color={salidaOf(ini.salida.value).color} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Lead cerrado — {salidaOf(ini.salida.value).label}</span>
            {ini.salida.excepcional && <span style={{ ...body, fontSize: 11, fontWeight: 600, color: C.warn, background: C.warnSoft, padding: "2px 8px", borderRadius: 999 }}>Salida excepcional</span>}
            <span style={{ ...mono, fontSize: 11.5, color: C.textMute, marginLeft: "auto" }}>{fmtDateLong(ini.salida.fecha)}</span>
          </div>
          {ini.salida.motivo && <div style={{ fontSize: 13, color: C.textSoft }}>Motivo: <b>{ini.salida.motivo}</b></div>}
          {ini.salida.fechaRetomar && <div style={{ fontSize: 13, color: C.textSoft }}>Retomar el: <b style={mono}>{fmtDateLong(ini.salida.fechaRetomar)}</b></div>}
          {ini.salida.nota && <div style={{ fontSize: 13, color: C.textSoft, marginTop: 3 }}>{ini.salida.nota}</div>}
          <button onClick={onReabrir} style={{ ...body, marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: C.surface,
            border: `1px solid ${C.border}`, color: C.primary, padding: "7px 12px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RotateCcw size={13} /> Reabrir lead
          </button>
        </div>
      )}

      {warn && (
        <div style={{ ...body, background: C.dangerSoft, border: `1px solid #F6C9C9`, color: C.danger, borderRadius: 10, padding: "10px 13px", fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={14} /> {warn}
        </div>
      )}

      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ ...head, fontSize: 13, fontWeight: 700, color: C.text }}>Progreso del embudo</div>
          <div style={{ ...body, fontSize: 13, color: C.textSoft }}>Próxima acción: <span style={{ fontWeight: 600, color: C.text }}>{ini.accion || "—"}</span></div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {STAGES.map((st) => {
            const passed = st.id <= ini.stage;
            return <div key={st.id} title={`${String(st.id).padStart(2, "0")} ${st.label}`} style={{ flex: 1, height: 6, borderRadius: 3, background: passed ? PHASE_COLOR[st.phase] : C.border }} />;
          })}
        </div>
        <div style={{ ...mono, fontSize: 12, color: C.textMute, marginTop: 8 }}>{String(ini.stage).padStart(2, "0")} / 11 · {s.phase}</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {esHito ? (
            <HitoCard ini={ini} />
          ) : (
            <>
              <StageDataPanel ini={ini} onUpdateData={onUpdateData} payback={payback} />
              {ini.stage < 11 && !cerrado && (
                <button onClick={tryAdvance} style={{ ...body, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: C.primary, color: "#fff", border: "none", padding: "11px 15px", borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>
                  Avanzar a {String(ini.stage + 1).padStart(2, "0")} · {stageOf(ini.stage + 1).label} <ArrowUpRight size={16} />
                </button>
              )}
            </>
          )}

          <RegistrarInteraccion ini={ini} contactos={cons} onAddInteraccion={onAddInteraccion} cerrado={cerrado} />

          <Card style={{ padding: 18 }}>
            <h3 style={{ ...head, margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>Interacciones</h3>
            {ints.length === 0 && <Empty text="Sin interacciones registradas." />}
            {ints.map((n) => {
              const T = intTipo(n.tipo); const Icon = T.icon;
              const contacto = contactos.find((c) => c.id === n.contactoId);
              return (
                <div key={n.id} style={{ display: "flex", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primarySoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={15} color={C.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ ...body, fontSize: 13.5, fontWeight: 600, color: C.text }}>{n.tipo}</span>
                      {contacto && <span style={{ ...body, fontSize: 12.5, color: C.textMute }}>· {contacto.nombre}</span>}
                      <span style={{ ...mono, fontSize: 11.5, color: C.textMute, marginLeft: "auto" }}>{fmtDateLong(n.fecha)}</span>
                      <button onClick={() => onDeleteInteraccion(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C4CBDA", padding: 2, display: "flex" }}><Trash2 size={13} /></button>
                    </div>
                    {n.descripcion && <div style={{ ...body, fontSize: 13, color: C.textSoft, marginTop: 3, lineHeight: 1.45 }}>{n.descripcion}</div>}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AccionesPanel ini={ini} tareas={tks} onToggleTask={onToggleTask} onAddTask={onAddTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
          <Card style={{ padding: 18 }}>
            <h3 style={{ ...head, margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>Contactos de la empresa</h3>
            {cons.length === 0 && <Empty text="Sin contactos aún." />}
            {cons.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
                <Avatar name={c.nombre} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...body, fontSize: 14, fontWeight: 500, color: C.text }}>{c.nombre}</div>
                  <div style={{ ...body, fontSize: 12.5, color: C.textMute }}>{c.puesto} · <span style={mono}>{c.tel}</span></div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

// ── Tarjeta de etapa-hito ─────────────────────────────────────
function HitoCard({ ini }) {
  const s = stageOf(ini.stage); const c = PHASE_COLOR[s.phase];
  const criterio = HITO_CRITERIO[ini.stage];
  return (
    <Card style={{ padding: 18, borderColor: c + "55" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: c, background: c + "16", padding: "2px 7px", borderRadius: 6 }}>{String(s.id).padStart(2, "0")}</span>
        <span style={{ ...head, fontSize: 14, fontWeight: 700, color: C.text }}>{s.label}</span>
        <span style={{ ...body, fontSize: 11, fontWeight: 600, color: c, marginLeft: "auto", background: c + "12", padding: "2px 8px", borderRadius: 999 }}>ETAPA ACTUAL</span>
      </div>
      <div style={{ display: "flex", gap: 11, background: "#FAFBFD", borderRadius: 10, padding: "12px 14px" }}>
        <ArrowRight size={16} color={c} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ ...body, fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>
          Esta etapa es un hito: avanza registrando la interacción que la cumple.
          {criterio && <div style={{ marginTop: 4, color: C.textMute }}>{criterio}</div>}
          <div style={{ marginTop: 6, fontSize: 12.5, color: C.textMute }}>Usa <b>Registrar interacción</b> abajo y marca "avanzar de etapa".</div>
        </div>
      </div>
    </Card>
  );
}

// ── Registrar interacción ─────────────────────────────────────
function RegistrarInteraccion({ ini, contactos, onAddInteraccion, cerrado }) {
  const s = stageOf(ini.stage);
  const esHito = s.kind === "hito" && !cerrado;
  const [tipo, setTipo] = useState("Nota");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [contactoId, setContactoId] = useState("");
  const [desc, setDesc] = useState("");
  const [avanzar, setAvanzar] = useState(false);
  const [nuevaAccion, setNuevaAccion] = useState("");
  const [customAccion, setCustomAccion] = useState("");
  const sugerencias = STAGE_SUGGESTIONS[ini.stage] || [];

  const guardar = () => {
    if (!desc.trim()) return;
    const accionFinal = nuevaAccion === "__custom" ? customAccion.trim() : nuevaAccion;
    onAddInteraccion(ini.id, { tipo, fecha, contactoId, descripcion: desc.trim() }, { avanzar, nuevaAccion: accionFinal });
    setDesc(""); setAvanzar(false); setNuevaAccion(""); setCustomAccion("");
    setFecha(new Date().toISOString().slice(0, 10));
  };

  const lbl = { ...body, fontSize: 12, fontWeight: 500, color: C.textSoft, display: "block", marginBottom: 5 };
  const capTitle = { ...body, fontSize: 11.5, fontWeight: 600, color: C.textMute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 };

  return (
    <Card style={{ padding: 18 }}>
      <h3 style={{ ...head, margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: C.text }}>Registrar interacción</h3>

      <div style={capTitle}>Qué pasó</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {INT_TIPOS.map((t) => {
          const Icon = t.icon; const active = tipo === t.value;
          return (
            <button key={t.value} onClick={() => setTipo(t.value)} style={{ ...body, flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, padding: "9px 4px", borderRadius: 9, cursor: "pointer",
              border: active ? `1.5px solid ${C.primary}` : `1px solid ${C.border}`, background: active ? C.primarySoft : C.surface,
              color: active ? C.primary : C.textSoft, fontSize: 12, fontWeight: 600 }}>
              <Icon size={16} /> {t.value}
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><label style={lbl}>Fecha</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ ...inp, ...mono }} /></div>
        <div>
          <label style={lbl}>Contacto (opcional)</label>
          <select value={contactoId} onChange={(e) => setContactoId(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            <option value="">—</option>
            {contactos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Descripción</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="Qué se habló, qué se acordó…" />
      </div>

      <div style={capTitle}>Qué sigue</div>
      <div style={{ marginBottom: 12 }}>
        <label style={lbl}>Próxima acción</label>
        <select value={nuevaAccion} onChange={(e) => setNuevaAccion(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
          <option value="">Mantener: {ini.accion || "—"}</option>
          {sugerencias.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
          <option value="__custom">Otra… (escribir)</option>
        </select>
        {nuevaAccion === "__custom" && <input autoFocus value={customAccion} onChange={(e) => setCustomAccion(e.target.value)} placeholder="Escribe la próxima acción" style={{ ...inp, marginTop: 8 }} />}
      </div>

      {esHito && ini.stage < 11 && (
        <label style={{ ...body, display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: C.primarySoft, border: `1px solid ${C.primary}33`, borderRadius: 10, cursor: "pointer", marginBottom: 14 }}>
          <input type="checkbox" checked={avanzar} onChange={(e) => setAvanzar(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.primary }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Avanzar a <b>{String(ini.stage + 1).padStart(2, "0")} · {stageOf(ini.stage + 1).label}</b> con esta interacción</span>
        </label>
      )}

      <button onClick={guardar} disabled={!desc.trim()} style={{ ...body, width: "100%", background: desc.trim() ? C.text : "#C4CBDA", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 14, fontWeight: 600, cursor: desc.trim() ? "pointer" : "default" }}>
        Guardar interacción
      </button>
    </Card>
  );
}

// ── Panel de acciones (tareas) ────────────────────────────────
function AccionesPanel({ ini, tareas, onToggleTask, onAddTask, onUpdateTask, onDeleteTask }) {
  const [newTask, setNewTask] = useState("");
  const [newDate, setNewDate] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const nextTask = tareas.filter((t) => !t.done).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0];
  const submitTask = () => { if (!newTask.trim()) return; onAddTask(ini.id, newTask.trim(), newDate || null); setNewTask(""); setNewDate(""); };

  return (
    <Card style={{ padding: 18 }}>
      <h3 style={{ ...head, margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: C.text }}>Acciones / pendientes</h3>
      {nextTask && (
        <div style={{ background: C.warnSoft, border: "1px solid #FFE8A3", borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 9 }}>
          <Calendar size={15} color={C.warn} />
          <span style={{ ...body, fontSize: 13, fontWeight: 500 }}>Próxima: {nextTask.titulo}</span>
          <span style={{ ...mono, fontSize: 12.5, color: C.warn, marginLeft: "auto" }}>{fmtDate(nextTask.fecha)}</span>
        </div>
      )}
      {tareas.length === 0 && <Empty text="Sin acciones. Añade la primera." />}
      {tareas.map((t) => (
        editingTask?.id === t.id ? (
          <div key={t.id} style={{ padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
            <input value={editingTask.titulo} onChange={(e) => setEditingTask({ ...editingTask, titulo: e.target.value })} style={inp} autoFocus />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input type="date" value={editingTask.fecha || ""} onChange={(e) => setEditingTask({ ...editingTask, fecha: e.target.value })} style={{ ...inp, ...mono, flex: 1 }} />
              <button onClick={() => { onUpdateTask(t.id, { titulo: editingTask.titulo.trim() || t.titulo, fecha: editingTask.fecha || null }); setEditingTask(null); }} style={{ ...body, background: C.text, color: "#fff", border: "none", borderRadius: 9, padding: "0 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Guardar</button>
              <button onClick={() => setEditingTask(null)} style={{ ...body, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "0 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>×</button>
            </div>
          </div>
        ) : (
          <TaskRow key={t.id} t={t} showCheck onToggle={onToggleTask} onEdit={() => setEditingTask({ id: t.id, titulo: t.titulo, fecha: t.fecha })} onDelete={() => onDeleteTask(t.id)} />
        )
      ))}
      <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitTask()} placeholder="Nueva acción…" style={inp} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ ...inp, ...mono, flex: 1 }} />
          <button onClick={submitTask} style={{ ...body, background: C.text, color: "#fff", border: "none", borderRadius: 9, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Añadir</button>
        </div>
      </div>
    </Card>
  );
}

// ── Panel de datos por etapa ──────────────────────────────────
function StageDataPanel({ ini, onUpdateData, payback }) {
  const relevantStages = STAGES.filter((st) => STAGE_FIELDS[st.id] && st.id <= ini.stage);
  if (relevantStages.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {relevantStages.map((st) => {
        const fields = STAGE_FIELDS[st.id];
        const isCurrent = st.id === ini.stage;
        const c = PHASE_COLOR[st.phase];
        return (
          <Card key={st.id} style={{ padding: 18, borderColor: isCurrent ? c + "55" : C.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: c, background: c + "16", padding: "2px 7px", borderRadius: 6 }}>{String(st.id).padStart(2, "0")}</span>
              <span style={{ ...head, fontSize: 14, fontWeight: 700, color: C.text }}>{st.label}</span>
              {isCurrent && <span style={{ ...body, fontSize: 11, fontWeight: 600, color: c, marginLeft: "auto", background: c + "12", padding: "2px 8px", borderRadius: 999 }}>ETAPA ACTUAL</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {fields.map((f) => <StageField key={f.key} f={f} ini={ini} onUpdateData={onUpdateData} payback={payback} />)}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StageField({ f, ini, onUpdateData, payback }) {
  const val = ini.data?.[f.key] ?? "";
  const full = f.type === "textarea" || f.type === "computed";
  const set = (v) => onUpdateData(ini.id, { [f.key]: v });
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={{ ...body, fontSize: 12, fontWeight: 500, color: C.textSoft, display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        {f.label}{f.required && <span style={{ color: C.danger, fontSize: 11 }}>obligatorio</span>}
      </label>
      {f.type === "computed" ? (
        <div style={{ ...mono, fontSize: 20, fontWeight: 700, color: payback ? C.success : "#C4CBDA", padding: "6px 0" }}>{payback ? `${payback} años` : "—"}</div>
      ) : f.type === "textarea" ? (
        <textarea value={val} onChange={(e) => set(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
      ) : f.type === "select" ? (
        <select value={val} onChange={(e) => set(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
          <option value="">—</option>
          {f.options.map((o) => { const v = typeof o === "string" ? o : o.value; const l = typeof o === "string" ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
        </select>
      ) : f.type === "usd" ? (
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ ...mono, position: "absolute", left: 11, top: 9, color: C.textMute, fontSize: 14 }}>$</span>
            <input type="number" value={val} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inp, ...mono, paddingLeft: 22 }} placeholder="0" />
          </div>
          {val !== "" && <div style={{ ...mono, fontSize: 11, color: C.textMute, marginTop: 3 }}>≈ {fmtMXN(val)} MXN</div>}
        </div>
      ) : f.type === "number" ? (
        <input type="number" value={val} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inp, ...mono }} placeholder="0" />
      ) : f.type === "date" ? (
        <input type="date" value={val} onChange={(e) => set(e.target.value)} style={{ ...inp, ...mono }} />
      ) : (
        <input value={val} onChange={(e) => set(e.target.value)} style={inp} />
      )}
    </div>
  );
}

// ── Modal crear/editar ────────────────────────────────────────
function FormModal({ modal, empresas, onClose, onSubmit }) {
  const editing = modal.entity;
  const [form, setForm] = useState(() => {
    if (editing) {
      if (modal.type === "empresa") return { nombre: editing.nombre, segmento: editing.segmento };
      if (modal.type === "contacto") return { ...editing };
      if (modal.type === "lead") return { nombre: editing.nombre, empresaId: editing.empresaId, cierre: editing.cierre };
    }
    if (modal.empresaId) return { empresaId: modal.empresaId }; // crear desde ficha de empresa
    return {};
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [modoEmpresa, setModoEmpresa] = useState("existente");
  const titles = { empresa: editing ? "Editar empresa" : "Nueva empresa", contacto: editing ? "Editar contacto" : "Nuevo contacto", lead: editing ? "Editar lead" : "Nuevo lead" };

  const canSubmit = () => {
    if (modal.type === "empresa") return form.nombre?.trim();
    if (modal.type === "contacto") return form.nombre?.trim() && form.empresaId;
    if (modal.type === "lead") {
      if (editing) return form.nombre?.trim() && form.empresaId;
      const emp = modoEmpresa === "existente" ? form.empresaId : form.nuevaEmpresa?.trim();
      return form.nombre?.trim() && emp;
    }
  };
  const submit = () => {
    if (!canSubmit()) return;
    if (modal.type === "lead" && !editing && modoEmpresa === "nueva") { onSubmit({ ...form, empresaId: null }); return; }
    if (modal.type === "lead" && !editing) { onSubmit({ ...form, nuevaEmpresa: null }); return; }
    onSubmit(form);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,0,98,0.35)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 440, padding: 24, boxShadow: "0 16px 48px rgba(2,0,98,0.22)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ ...head, fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>{titles[modal.type]}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMute }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {modal.type === "empresa" && (
            <>
              <Field label="Nombre de la empresa" required><input style={inp} value={form.nombre || ""} onChange={(e) => set("nombre", e.target.value)} autoFocus /></Field>
              <Field label="Segmento">
                <select style={{ ...inp, cursor: "pointer" }} value={form.segmento || ""} onChange={(e) => set("segmento", e.target.value)}>
                  <option value="">Selecciona…</option>
                  {SEGMENTOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </>
          )}
          {modal.type === "contacto" && (
            <>
              <Field label="Empresa" required>
                <select style={{ ...inp, cursor: "pointer" }} value={form.empresaId || ""} onChange={(e) => set("empresaId", e.target.value)}>
                  <option value="">Selecciona…</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </Field>
              <Field label="Nombre" required><input style={inp} value={form.nombre || ""} onChange={(e) => set("nombre", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Puesto"><input style={inp} value={form.puesto || ""} onChange={(e) => set("puesto", e.target.value)} /></Field>
                <Field label="Teléfono"><input style={{ ...inp, ...mono }} value={form.tel || ""} onChange={(e) => set("tel", e.target.value)} /></Field>
              </div>
              <Field label="Correo"><input style={inp} value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
            </>
          )}
          {modal.type === "lead" && (
            <>
              {!editing && (
                <div style={{ display: "flex", gap: 6, background: "#EEF1F7", padding: 3, borderRadius: 9 }}>
                  {["existente", "nueva"].map((m) => (
                    <button key={m} onClick={() => setModoEmpresa(m)} style={{ ...body, flex: 1, padding: "7px", borderRadius: 7, border: "none", cursor: "pointer",
                      fontSize: 13, fontWeight: 600, background: modoEmpresa === m ? C.surface : "transparent", color: modoEmpresa === m ? C.text : C.textMute,
                      boxShadow: modoEmpresa === m ? "0 1px 2px rgba(2,0,98,0.08)" : "none" }}>{m === "existente" ? "Empresa existente" : "Empresa nueva"}</button>
                  ))}
                </div>
              )}
              {(editing || modoEmpresa === "existente") ? (
                <Field label="Empresa" required>
                  <select style={{ ...inp, cursor: "pointer" }} value={form.empresaId || ""} onChange={(e) => set("empresaId", e.target.value)}>
                    <option value="">Selecciona…</option>
                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </Field>
              ) : (
                <Field label="Nombre de la empresa nueva" required><input style={inp} value={form.nuevaEmpresa || ""} onChange={(e) => set("nuevaEmpresa", e.target.value)} autoFocus /></Field>
              )}
              <Field label="Proyecto / iniciativa" required><input style={inp} value={form.nombre || ""} onChange={(e) => set("nombre", e.target.value)} placeholder="SFV techo nave 2, BESS respaldo…" /></Field>
              {editing && <Field label="Cierre estimado"><input type="date" style={{ ...inp, ...mono }} value={form.cierre || ""} onChange={(e) => set("cierre", e.target.value)} /></Field>}
              {!editing && <p style={{ ...body, fontSize: 12.5, color: C.textMute, margin: 0 }}>Arranca en etapa 01. Los datos se completan conforme avanza.</p>}
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...body, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", color: C.text }}>Cancelar</button>
          <button onClick={submit} disabled={!canSubmit()} style={{ ...body, background: canSubmit() ? C.primary : "#C4CBDA", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: canSubmit() ? "pointer" : "default" }}>{editing ? "Guardar" : "Crear"}</button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ ...body, fontSize: 12.5, fontWeight: 500, color: C.textSoft, display: "flex", gap: 5, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.danger, fontSize: 11 }}>obligatorio</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal de salida del pipeline ──────────────────────────────
function SalidaModal({ ini, onClose, onSubmit }) {
  const normales = SALIDAS.filter((s) => enRangoNormal(s, ini.stage));
  const excepcionales = SALIDAS.filter((s) => !enRangoNormal(s, ini.stage));
  const [verMas, setVerMas] = useState(false);
  const [sel, setSel] = useState(null);           // value de la salida elegida
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [fechaRetomar, setFechaRetomar] = useState("");
  const [ack, setAck] = useState(false);

  const def = sel ? salidaOf(sel) : null;
  const esExcepcional = def ? !enRangoNormal(def, ini.stage) : false;

  const puedeGuardar = () => {
    if (!def) return false;
    if (def.exige === "motivo" && !motivo) return false;
    if (def.exige === "fecha" && !fechaRetomar) return false;
    if (esExcepcional && !ack) return false;
    return true;
  };

  const guardar = () => {
    if (!puedeGuardar()) return;
    onSubmit({
      value: def.value,
      fecha: new Date().toISOString().slice(0, 10),
      motivo: def.exige === "motivo" ? motivo : null,
      nota: nota.trim() || null,
      fechaRetomar: def.exige === "fecha" ? fechaRetomar : null,
      excepcional: esExcepcional,
    });
  };

  const OptionBtn = ({ s }) => {
    const active = sel === s.value;
    return (
      <button onClick={() => { setSel(s.value); setMotivo(""); setNota(""); setFechaRetomar(""); setAck(false); }}
        style={{ ...body, display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "11px 13px", borderRadius: 10, cursor: "pointer",
          border: active ? `1.5px solid ${s.color}` : `1px solid ${C.border}`, background: active ? s.color + "0F" : C.surface,
          color: C.text, fontSize: 14, fontWeight: 600, textAlign: "left", marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color, flexShrink: 0 }} />
        {s.label}
        {s.exige && <span style={{ ...body, marginLeft: "auto", fontSize: 11.5, fontWeight: 500, color: C.textMute }}>{s.exige === "motivo" ? "exige motivo" : "exige fecha"}</span>}
      </button>
    );
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,0,98,0.35)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 460, padding: 24, boxShadow: "0 16px 48px rgba(2,0,98,0.22)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ ...head, fontSize: 18, fontWeight: 700, margin: 0, color: C.text }}>Marcar salida</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMute }}><X size={20} /></button>
        </div>
        <p style={{ ...body, fontSize: 13, color: C.textMute, margin: "0 0 16px" }}>
          {ini.nombre} · etapa <span style={mono}>{String(ini.stage).padStart(2, "0")}</span> · {stageOf(ini.stage).label}
        </p>

        {normales.map((s) => <OptionBtn key={s.value} s={s} />)}

        {excepcionales.length > 0 && (
          <>
            <button onClick={() => setVerMas((v) => !v)} style={{ ...body, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
              cursor: "pointer", color: C.textSoft, fontSize: 13, fontWeight: 600, padding: "6px 0", marginBottom: 6 }}>
              <ChevronDown size={15} style={{ transform: verMas ? "rotate(180deg)" : "none", transition: "transform .15s" }} /> Más opciones (excepcionales)
            </button>
            {verMas && excepcionales.map((s) => <OptionBtn key={s.value} s={s} />)}
          </>
        )}

        {/* campos condicionales */}
        {def?.exige === "motivo" && (
          <div style={{ marginTop: 6 }}>
            <label style={{ ...body, fontSize: 12.5, fontWeight: 500, color: C.textSoft, display: "block", marginBottom: 6 }}>Motivo de pérdida <span style={{ color: C.danger, fontSize: 11 }}>obligatorio</span></label>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              <option value="">Selecciona…</option>
              {MOTIVOS_PERDIDA.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
        {def?.exige === "fecha" && (
          <div style={{ marginTop: 6 }}>
            <label style={{ ...body, fontSize: 12.5, fontWeight: 500, color: C.textSoft, display: "block", marginBottom: 6 }}>Fecha para retomar <span style={{ color: C.danger, fontSize: 11 }}>obligatorio</span></label>
            <input type="date" value={fechaRetomar} onChange={(e) => setFechaRetomar(e.target.value)} style={{ ...inp, ...mono }} />
          </div>
        )}
        {def && (
          <div style={{ marginTop: 12 }}>
            <label style={{ ...body, fontSize: 12.5, fontWeight: 500, color: C.textSoft, display: "block", marginBottom: 6 }}>Nota {def.exige !== "motivo" ? "(opcional)" : "(opcional)"}</label>
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="Contexto adicional…" />
          </div>
        )}

        {esExcepcional && (
          <label style={{ ...body, display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 13px", background: C.warnSoft, border: `1px solid #FFE8A3`, borderRadius: 10, cursor: "pointer", marginTop: 14 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.warn, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: C.text }}>Reconozco que <b>{def.label}</b> es una salida <b>excepcional</b> para la etapa {String(ini.stage).padStart(2, "0")}; quedará marcada como tal.</span>
          </label>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ ...body, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", color: C.text }}>Cancelar</button>
          <button onClick={guardar} disabled={!puedeGuardar()} style={{ ...body, background: puedeGuardar() ? (def ? salidaOf(def.value).color : C.text) : "#C4CBDA", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: puedeGuardar() ? "pointer" : "default" }}>Confirmar salida</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de confirmación (borrar) ────────────────────────────
function ConfirmModal({ title, body: bodyText, onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(2,0,98,0.35)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 16px 48px rgba(2,0,98,0.22)" }}>
        <div style={{ display: "flex", gap: 13, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: C.dangerSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <AlertTriangle size={19} color={C.danger} />
          </div>
          <div>
            <h2 style={{ ...head, fontSize: 17, fontWeight: 700, margin: "2px 0 6px", color: C.text }}>{title}</h2>
            <p style={{ ...body, fontSize: 13.5, color: C.textSoft, margin: 0, lineHeight: 1.5 }}>{bodyText}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ ...body, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", color: C.text }}>Cancelar</button>
          <button onClick={onConfirm} style={{ ...body, background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Borrar</button>
        </div>
      </div>
    </div>
  );
}
