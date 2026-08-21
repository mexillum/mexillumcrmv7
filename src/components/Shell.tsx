import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Building2,
  Users,
  LogOut,
  Settings,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AjustesDialog } from "@/components/AjustesDialog";

/** PRD §8: cinco secciones. En teléfono son la barra inferior (§8.1). */
const NAV = [
  { to: "/", label: "Panel", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Leads", icon: Target, end: false },
  { to: "/acciones", label: "Acciones", icon: CheckSquare, end: false },
  { to: "/empresas", label: "Empresas", icon: Building2, end: false },
  { to: "/contactos", label: "Contactos", icon: Users, end: false },
];

export function Shell() {
  const { signOut } = useAuthActions();
  const yo = useQuery(api.auth.yo);
  const [ajustes, setAjustes] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Barra lateral (escritorio) ────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-sidebar md:flex">
        <div className="px-5 py-5">
          <p className="font-heading text-lg font-semibold tracking-tight text-sidebar-foreground">
            CRM
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pipeline comercial
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 pb-2 text-xs text-muted-foreground">
            {yo?.email}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground"
            onClick={() => setAjustes(true)}
          >
            <Settings className="size-4" />
            Ajustes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* ── Contenido ─────────────────────────────────────────── */}
      <main className="px-4 pb-24 pt-6 md:ml-56 md:px-8 md:pb-10">
        {/* Tope generoso: en un portátil ancho, 1152px dejaba una franja
            vacía enorme a la derecha y la app parecía una columna de móvil.
            1600 llena la pantalla sin que las líneas de texto se alarguen
            hasta ser incómodas de leer. */}
        <div className="mx-auto max-w-[1600px]">
          <Outlet />
        </div>
      </main>

      {/* ── Barra inferior (teléfono) — PRD §8.1 ──────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-sidebar md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {ajustes && <AjustesDialog abierto onCerrar={() => setAjustes(false)} />}
    </div>
  );
}

/** Encabezado común de cada página. */
export function PageHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </header>
  );
}
