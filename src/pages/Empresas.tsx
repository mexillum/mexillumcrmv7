import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Plus, Search, Building2 } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { leadOculto } from "../../convex/stages";
import { PageHead } from "@/components/Shell";
import { EmpresaForm } from "@/components/formularios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { hoyISO, VACIO } from "@/lib/formato";

export function Empresas() {
  const navigate = useNavigate();
  const hoy = hoyISO();
  const empresas = useQuery(api.empresas.list);
  const iniciativas = useQuery(api.iniciativas.list);
  const contactos = useQuery(api.contactos.list);

  const [q, setQ] = useState("");
  const [nueva, setNueva] = useState(false);

  const cargando = empresas === undefined;

  const filas = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return (empresas ?? [])
      .filter((e) => !texto || e.nombre.toLowerCase().includes(texto))
      .map((e) => {
        const suyas = (iniciativas ?? []).filter((i) => i.empresaId === e._id);
        return {
          empresa: e,
          leads: suyas.length,
          abiertos: suyas.filter((i) => !leadOculto(i.salida, hoy)).length,
          contactos: (contactos ?? []).filter((c) => c.empresaId === e._id).length,
        };
      });
  }, [empresas, iniciativas, contactos, q, hoy]);

  return (
    <>
      <PageHead
        title="Empresas"
        sub="Los contactos y los proyectos cuelgan de aquí"
        action={
          <Button onClick={() => setNueva(true)}>
            <Plus className="size-4" />
            Nueva empresa
          </Button>
        }
      />

      <div className="relative mb-4 w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar empresa…"
          className="pl-9"
        />
      </div>

      {cargando ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-heading text-sm font-medium text-foreground">
            {empresas?.length ? "Ninguna empresa coincide." : "Todavía no hay empresas."}
          </p>
          {!empresas?.length && (
            <Button className="mt-4" onClick={() => setNueva(true)}>
              <Plus className="size-4" />
              Crear la primera
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filas.map(({ empresa, leads, abiertos, contactos: nContactos }) => (
            <button
              key={empresa._id}
              type="button"
              onClick={() => navigate(`/empresas/${empresa._id}`)}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Building2 className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {empresa.nombre}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {empresa.segmento ?? VACIO}
                  </p>
                </div>
              </div>

              <dl className="mt-4 flex gap-5 border-t border-border pt-3">
                <Cifra label="Proyectos" valor={leads} />
                <Cifra label="Abiertos" valor={abiertos} />
                <Cifra label="Contactos" valor={nContactos} />
              </dl>
            </button>
          ))}
        </div>
      )}

      {nueva && <EmpresaForm abierto onCerrar={() => setNueva(false)} />}
    </>
  );
}

function Cifra({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-heading text-base font-semibold tabular-nums text-foreground">
        {valor}
      </dd>
    </div>
  );
}
