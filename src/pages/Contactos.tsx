import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Plus, Search } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { PageHead } from "@/components/Shell";
import { ContactoForm } from "@/components/formularios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VACIO } from "@/lib/formato";

export function Contactos() {
  const navigate = useNavigate();
  const contactos = useQuery(api.contactos.list);
  const empresas = useQuery(api.empresas.list);

  const [q, setQ] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const cargando = contactos === undefined || empresas === undefined;

  const nombreEmpresa = useMemo(() => {
    const mapa = new Map((empresas ?? []).map((e) => [e._id as string, e.nombre]));
    return (id: string) => mapa.get(id) ?? VACIO;
  }, [empresas]);

  const filas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return (contactos ?? [])
      .filter(
        (c) =>
          !texto ||
          (c.nombre + " " + nombreEmpresa(c.empresaId) + " " + (c.email ?? ""))
            .toLowerCase()
            .includes(texto)
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [contactos, q, nombreEmpresa]);

  const contactoEditado = (contactos ?? []).find((c) => c._id === editando);
  const hayEmpresas = (empresas ?? []).length > 0;

  return (
    <>
      <PageHead
        title="Contactos"
        sub="Cada contacto pertenece a una empresa"
        action={
          <Button onClick={() => setNuevo(true)} disabled={!hayEmpresas}>
            <Plus className="size-4" />
            Nuevo contacto
          </Button>
        }
      />

      <div className="relative mb-4 w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, empresa o correo…"
          className="pl-9"
        />
      </div>

      {cargando ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-heading text-sm font-medium text-foreground">
            {contactos?.length
              ? "Ningún contacto coincide."
              : "Todavía no hay contactos."}
          </p>
          {!hayEmpresas && (
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Un contacto necesita una empresa. Crea la empresa primero.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {filas.map((c) => (
              <li
                key={c._id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/40"
              >
                <button
                  type="button"
                  onClick={() => setEditando(c._id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold text-foreground">
                    {c.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.puesto ?? VACIO}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/empresas/${c.empresaId}`)}
                  className="shrink-0 text-[13px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {nombreEmpresa(c.empresaId)}
                </button>

                <div className="flex w-full shrink-0 flex-col text-xs text-muted-foreground sm:w-56 sm:text-right">
                  {c.email && <span className="truncate">{c.email}</span>}
                  {c.tel && (
                    <span className="font-heading tabular-nums">{c.tel}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nuevo && <ContactoForm abierto onCerrar={() => setNuevo(false)} />}
      {contactoEditado && (
        <ContactoForm
          abierto
          onCerrar={() => setEditando(null)}
          contacto={contactoEditado}
        />
      )}
    </>
  );
}
