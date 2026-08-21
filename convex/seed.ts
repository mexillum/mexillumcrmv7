import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Datos de demostración del prototipo original.
 *
 * PRD §3: la base arranca VACÍA. Esto NO se ejecuta solo. Solo si lo
 * pides a mano, para jugar con la interfaz sin capturar nada:
 *
 *   npx convex run seed:cargarDemo
 *
 * Y para dejarla limpia otra vez:
 *
 *   npx convex run seed:borrarTodo
 */

const EMPRESAS = [
  { key: "e1", nombre: "Cementos del Bajío", segmento: "Cemento y materiales de construcción" },
  { key: "e2", nombre: "Aceros del Norte", segmento: "Acero y metales" },
  { key: "e3", nombre: "Minera San Rafael", segmento: "Minería" },
  { key: "e4", nombre: "Alimentos Vega", segmento: "Alimentos y bebidas" },
];

const CONTACTOS = [
  { empresa: "e1", nombre: "Laura Méndez", puesto: "Dir. Planta", email: "laura@cementosbajio.mx", tel: "477 123 4567" },
  { empresa: "e1", nombre: "Raúl Ibáñez", puesto: "Finanzas", email: "raul@cementosbajio.mx", tel: "477 123 4568" },
  { empresa: "e2", nombre: "Sofía Duarte", puesto: "Operaciones", email: "sofia@acerosnorte.mx", tel: "81 2233 4455" },
  { empresa: "e3", nombre: "Dr. Peña", puesto: "Administración", email: "adm@mineranrafael.mx", tel: "55 9988 7766" },
  { empresa: "e4", nombre: "Mónica Vega", puesto: "Directora", email: "monica@alimentosvega.mx", tel: "33 4455 6677" },
];

const INICIATIVAS = [
  {
    key: "i1", empresa: "e1", nombre: "SFV techo nave 2", stage: 8, cierre: "2026-10-15",
    data: { segmento: "Cemento y materiales de construcción", generador: "Mexillum", tipoSistema: "SFV", capex: 420000, ahorroAnual: 95000, capacidad: "850 kWp", montoPropuesta: 465000 },
  },
  { key: "i2", empresa: "e1", nombre: "BESS respaldo línea", stage: 3, cierre: "2026-12-01", data: {} },
  { key: "i3", empresa: "e2", nombre: "SFV bombeo riego", stage: 5, cierre: "2026-11-20", data: { tipoSistema: "SFV", tarifa: "gdmto", consumoMensual: 48000 } },
  {
    key: "i4", empresa: "e3", nombre: "SFV + BESS crítico", stage: 10, cierre: "2026-09-30",
    data: { tipoSistema: "SFV + BESS", capex: 780000, ahorroAnual: 150000, capacidad: "1.2 MWp + 500 kWh", montoPropuesta: 830000, montoNegociado: 810000 },
  },
  { key: "i5", empresa: "e4", nombre: "SFV azotea CD", stage: 1, cierre: undefined, data: {} },
];

const TAREAS = [
  { ini: "i1", titulo: "Enviar propuesta revisada", fecha: "2026-08-18", done: false },
  { ini: "i1", titulo: "Llamada de seguimiento", fecha: "2026-08-22", done: false },
  { ini: "i2", titulo: "Pedir recibos CFE", fecha: "2026-08-19", done: false },
  { ini: "i3", titulo: "Agendar visita técnica", fecha: "2026-08-25", done: false },
  { ini: "i4", titulo: "Confirmar firma contrato", fecha: "2026-08-21", done: false },
  { ini: "i5", titulo: "Investigar consumo estimado", fecha: "2026-08-14", done: true },
];

const INTERACCIONES = [
  { ini: "i1", contacto: "Laura Méndez", tipo: "Correo", fecha: "2026-08-12", descripcion: "Envié la propuesta formal con cotización. Confirmó recepción." },
  { ini: "i1", contacto: "Laura Méndez", tipo: "Reunión", fecha: "2026-08-05", descripcion: "Diagnóstico en sitio. Revisamos consumo y espacio de techo." },
  { ini: "i3", contacto: "Sofía Duarte", tipo: "Llamada", fecha: "2026-08-10", descripcion: "Pedí recibos CFE de los últimos 12 meses." },
];

/** Toma el único usuario de la base. La app es de un solo usuario. */
async function unicoUsuario(ctx: { db: any }): Promise<Id<"users">> {
  const users = await ctx.db.query("users").collect();
  if (users.length === 0) {
    throw new Error("No hay ningún usuario. Crea tu cuenta antes de sembrar datos.");
  }
  if (users.length > 1) {
    throw new Error("Hay más de un usuario; el seed no sabe a cuál asignar los datos.");
  }
  return users[0]._id;
}

export const cargarDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await unicoUsuario(ctx);

    const empresaIds: Record<string, Id<"empresas">> = {};
    for (const e of EMPRESAS) {
      empresaIds[e.key] = await ctx.db.insert("empresas", {
        userId, nombre: e.nombre, segmento: e.segmento,
      });
    }

    const contactoIds: Record<string, Id<"contactos">> = {};
    for (const c of CONTACTOS) {
      contactoIds[c.nombre] = await ctx.db.insert("contactos", {
        userId, empresaId: empresaIds[c.empresa],
        nombre: c.nombre, puesto: c.puesto, email: c.email, tel: c.tel,
      });
    }

    const iniIds: Record<string, Id<"iniciativas">> = {};
    for (const i of INICIATIVAS) {
      iniIds[i.key] = await ctx.db.insert("iniciativas", {
        userId, empresaId: empresaIds[i.empresa],
        nombre: i.nombre, stage: i.stage, cierre: i.cierre, data: i.data,
      });
    }

    for (const t of TAREAS) {
      await ctx.db.insert("tareas", {
        userId, iniciativaId: iniIds[t.ini],
        titulo: t.titulo, fecha: t.fecha, done: t.done,
      });
    }

    for (const n of INTERACCIONES) {
      await ctx.db.insert("interacciones", {
        userId, iniciativaId: iniIds[n.ini],
        tipo: n.tipo, fecha: n.fecha,
        contactoId: contactoIds[n.contacto],
        descripcion: n.descripcion,
      });
    }

    return `Sembrado: ${EMPRESAS.length} empresas, ${CONTACTOS.length} contactos, ${INICIATIVAS.length} leads, ${TAREAS.length} tareas, ${INTERACCIONES.length} interacciones.`;
  },
});

/** Borra TODOS los datos de negocio. No toca las cuentas de usuario. */
export const borrarTodo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tablas = ["interacciones", "tareas", "iniciativas", "contactos", "empresas"] as const;
    let total = 0;
    for (const tabla of tablas) {
      const filas = await ctx.db.query(tabla).collect();
      for (const f of filas) {
        await ctx.db.delete(f._id);
        total++;
      }
    }
    return `Borrados ${total} registros.`;
  },
});
