/**
 * Convex envuelve los errores del servidor con su propio prefijo y una
 * traza. Al usuario le sirve la frase, no el envoltorio.
 */
export function mensajeDeError(error: unknown): string {
  if (!(error instanceof Error)) return "Algo salió mal.";
  const limpio = error.message
    .replace(/^\[CONVEX[^\]]*\]\s*/, "")
    .replace(/^\[Request ID:[^\]]*\]\s*/, "")
    .replace(/(?:Uncaught\s+)?Error:\s*/g, "")
    .split("\n")[0]
    .trim();
  return limpio || "Algo salió mal.";
}
