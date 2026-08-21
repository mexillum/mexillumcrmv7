import { useCallback, useState } from "react";

/**
 * Preferencia sencilla que sobrevive al refresco, en localStorage.
 * Se usa para recordar Tabla / Tablero (PRD §8).
 */
export function usePreferencia<T extends string>(
  clave: string,
  porDefecto: T,
  validos: readonly T[]
): [T, (v: T) => void] {
  const [valor, setValor] = useState<T>(() => {
    try {
      const guardado = localStorage.getItem(clave);
      return validos.includes(guardado as T) ? (guardado as T) : porDefecto;
    } catch {
      // Navegación privada o almacenamiento bloqueado: seguimos igual,
      // solo sin memoria.
      return porDefecto;
    }
  });

  const guardar = useCallback(
    (v: T) => {
      setValor(v);
      try {
        localStorage.setItem(clave, v);
      } catch {
        /* sin memoria, pero la app sigue */
      }
    },
    [clave]
  );

  return [valor, guardar];
}
