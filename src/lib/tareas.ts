import type { Doc } from "../../convex/_generated/dataModel";

/**
 * Contactos de una acción como lista de ids (string).
 * Fusiona el campo nuevo `contactoIds` con el viejo `contactoId`, para
 * que las acciones guardadas antes del cambio sigan mostrando su
 * contacto.
 */
export function contactosDeTarea(t: Doc<"tareas">): string[] {
  if (t.contactoIds && t.contactoIds.length > 0) return t.contactoIds;
  if (t.contactoId) return [t.contactoId];
  return [];
}
