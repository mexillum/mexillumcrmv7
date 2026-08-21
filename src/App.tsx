import { Routes, Route, Navigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/Shell";
import { Login } from "@/pages/Login";
import { Panel } from "@/pages/Panel";
import { Leads } from "@/pages/Leads";
import { LeadDetail } from "@/pages/LeadDetail";
import { Acciones } from "@/pages/Acciones";
import { Empresas } from "@/pages/Empresas";
import { EmpresaDetail } from "@/pages/EmpresaDetail";
import { Contactos } from "@/pages/Contactos";
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
            <Route path="/" element={<Panel />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/acciones" element={<Acciones />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/empresas/:id" element={<EmpresaDetail />} />
            <Route path="/contactos" element={<Contactos />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Authenticated>

      <Toaster position="top-right" />
    </>
  );
}
