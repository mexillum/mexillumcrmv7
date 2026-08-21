import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { Login } from "@/pages/Login";
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
        <Cargando texto="Sesión iniciada. El shell llega en el siguiente paso." />
      </Authenticated>

      <Toaster position="top-right" />
    </>
  );
}
