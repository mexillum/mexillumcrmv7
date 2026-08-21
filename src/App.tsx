import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { Login } from "@/pages/Login";
import { Bienvenida } from "@/pages/Bienvenida";
import { Cargando } from "@/components/Cargando";

export default function App() {
  return (
    <>
      <AuthLoading>
        <Cargando />
      </AuthLoading>

      <Unauthenticated>
        <Login />
      </Unauthenticated>

      <Authenticated>
        {/* El shell de navegación llega en el paso 3. */}
        <Bienvenida />
      </Authenticated>

      <Toaster position="top-right" />
    </>
  );
}
