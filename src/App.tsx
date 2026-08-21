import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/Shell";
import { Login } from "@/pages/Login";
import { Leads } from "@/pages/Leads";
import { EnObra } from "@/pages/EnObra";
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
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<EnObra title="Panel" paso="paso 6" />} />
            <Route path="/leads" element={<Leads />} />
            <Route
              path="/leads/:id"
              element={<EnObra title="Ficha del lead" paso="paso 5" />}
            />
            <Route
              path="/acciones"
              element={<EnObra title="Acciones" paso="paso 7" />}
            />
            <Route
              path="/empresas"
              element={<EnObra title="Empresas" paso="paso 7" />}
            />
            <Route
              path="/empresas/:id"
              element={<EnObra title="Empresa" paso="paso 7" />}
            />
            <Route
              path="/contactos"
              element={<EnObra title="Contactos" paso="paso 7" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Authenticated>

      <Toaster position="top-right" />
    </>
  );
}
