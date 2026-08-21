import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Puerto fijo y propio. Hay varios proyectos Mexillum en esta máquina;
  // con el puerto automático, este acababa en 5176 y "localhost:5173"
  // abría otro CRM distinto. strictPort hace que falle en voz alta en
  // vez de mudarse en silencio.
  server: {
    port: 5180,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
})
