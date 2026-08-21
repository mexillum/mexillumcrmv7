import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

// Sin URL, la app carga pero no habla con nadie y el fallo parece un
// problema de contraseña. Mejor romper aquí, con el motivo escrito.
if (!convexUrl) {
  throw new Error(
    "Falta VITE_CONVEX_URL. En local va en .env.local; en producción, en .env.production."
  );
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthProvider>
  </StrictMode>
);
