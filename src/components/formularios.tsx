import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { SEGMENTOS } from "../../convex/stages";
import { FormDialog } from "@/components/FormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SIN_SEGMENTO = "__ninguno";
const itemsSegmento = [
  { value: SIN_SEGMENTO, label: "Sin segmento" },
  ...SEGMENTOS.map((s) => ({ value: s, label: s })),
];

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}

// ── Empresa ──────────────────────────────────────────────────

export function EmpresaForm({
  abierto,
  onCerrar,
  empresa,
}: {
  abierto: boolean;
  onCerrar: () => void;
  empresa?: Doc<"empresas">;
}) {
  const crear = useMutation(api.empresas.create);
  const actualizar = useMutation(api.empresas.update);

  const [nombre, setNombre] = useState(empresa?.nombre ?? "");
  const [segmento, setSegmento] = useState(empresa?.segmento ?? SIN_SEGMENTO);

  return (
    <FormDialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={empresa ? "Editar empresa" : "Nueva empresa"}
      onGuardar={async () => {
        const datos = {
          nombre: nombre.trim(),
          segmento: segmento === SIN_SEGMENTO ? undefined : segmento,
        };
        if (!datos.nombre) throw new Error("La empresa necesita un nombre.");
        if (empresa) await actualizar({ id: empresa._id, ...datos });
        else await crear(datos);
      }}
    >
      <Campo label="Nombre">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
          placeholder="Cementos del Bajío"
        />
      </Campo>

      <Campo label="Segmento">
        <Select
          items={itemsSegmento}
          value={segmento}
          onValueChange={(v) => setSegmento(v ?? SIN_SEGMENTO)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {itemsSegmento.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>
    </FormDialog>
  );
}

// ── Contacto ─────────────────────────────────────────────────

export function ContactoForm({
  abierto,
  onCerrar,
  empresaId,
  contacto,
}: {
  abierto: boolean;
  onCerrar: () => void;
  empresaId?: Id<"empresas">;
  contacto?: Doc<"contactos">;
}) {
  const crear = useMutation(api.contactos.create);
  const actualizar = useMutation(api.contactos.update);
  const empresas = useQuery(api.empresas.list);

  const [nombre, setNombre] = useState(contacto?.nombre ?? "");
  const [puesto, setPuesto] = useState(contacto?.puesto ?? "");
  const [email, setEmail] = useState(contacto?.email ?? "");
  const [tel, setTel] = useState(contacto?.tel ?? "");
  const [empresaSel, setEmpresaSel] = useState<string>(
    contacto?.empresaId ?? empresaId ?? ""
  );

  const itemsEmpresa = (empresas ?? []).map((e) => ({
    value: e._id as string,
    label: e.nombre,
  }));

  return (
    <FormDialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={contacto ? "Editar contacto" : "Nuevo contacto"}
      descripcion="Los contactos pertenecen a la empresa, así que sirven para todos sus proyectos."
      onGuardar={async () => {
        const datos = {
          nombre: nombre.trim(),
          puesto: puesto.trim() || undefined,
          email: email.trim() || undefined,
          tel: tel.trim() || undefined,
        };
        if (!datos.nombre) throw new Error("El contacto necesita un nombre.");
        if (contacto) {
          await actualizar({ id: contacto._id, ...datos });
        } else {
          if (!empresaSel) throw new Error("Elige la empresa del contacto.");
          await crear({ empresaId: empresaSel as Id<"empresas">, ...datos });
        }
      }}
    >
      {!contacto && !empresaId && (
        <Campo label="Empresa">
          <Select
            items={itemsEmpresa}
            value={empresaSel}
            onValueChange={(v) => setEmpresaSel(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una empresa" />
            </SelectTrigger>
            <SelectContent>
              {itemsEmpresa.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      )}

      <Campo label="Nombre">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
          placeholder="Laura Méndez"
        />
      </Campo>

      <Campo label="Puesto">
        <Input
          value={puesto}
          onChange={(e) => setPuesto(e.target.value)}
          placeholder="Dir. Planta"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Correo">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="laura@empresa.mx"
          />
        </Campo>
        <Campo label="Teléfono">
          <Input
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="477 123 4567"
            className="font-heading tabular-nums"
          />
        </Campo>
      </div>
    </FormDialog>
  );
}

// ── Lead ─────────────────────────────────────────────────────

export function LeadForm({
  abierto,
  onCerrar,
  empresaId,
  lead,
}: {
  abierto: boolean;
  onCerrar: () => void;
  empresaId?: Id<"empresas">;
  lead?: Doc<"iniciativas">;
}) {
  const crear = useMutation(api.iniciativas.create);
  const actualizar = useMutation(api.iniciativas.update);
  const empresas = useQuery(api.empresas.list);

  const [nombre, setNombre] = useState(lead?.nombre ?? "");
  const [cierre, setCierre] = useState(lead?.cierre ?? "");
  const [empresaSel, setEmpresaSel] = useState<string>(
    lead?.empresaId ?? empresaId ?? ""
  );

  const itemsEmpresa = (empresas ?? []).map((e) => ({
    value: e._id as string,
    label: e.nombre,
  }));

  return (
    <FormDialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={lead ? "Editar lead" : "Nuevo lead"}
      descripcion={
        lead
          ? undefined
          : "Arranca en la etapa 01. Los datos del proyecto se capturan etapa por etapa."
      }
      onGuardar={async () => {
        const limpio = nombre.trim();
        if (!limpio) throw new Error("El lead necesita un nombre de proyecto.");
        if (lead) {
          await actualizar({
            id: lead._id,
            nombre: limpio,
            empresaId: (empresaSel as Id<"empresas">) || undefined,
            cierre: cierre || undefined,
          });
        } else {
          if (!empresaSel) throw new Error("Elige la empresa del lead.");
          await crear({
            empresaId: empresaSel as Id<"empresas">,
            nombre: limpio,
            cierre: cierre || undefined,
          });
        }
      }}
    >
      {!empresaId && (
        <Campo label="Empresa">
          <Select
            items={itemsEmpresa}
            value={empresaSel}
            onValueChange={(v) => setEmpresaSel(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una empresa" />
            </SelectTrigger>
            <SelectContent>
              {itemsEmpresa.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      )}

      <Campo label="Nombre del proyecto">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
          placeholder="SFV techo nave 2"
        />
      </Campo>

      <Campo label="Cierre estimado">
        <Input
          type="date"
          value={cierre}
          onChange={(e) => setCierre(e.target.value)}
          className="font-heading tabular-nums"
        />
      </Campo>
    </FormDialog>
  );
}
