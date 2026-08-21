import { PageHead } from "@/components/Shell";

/** Marcador para las secciones que llegan en los siguientes pasos. */
export function EnObra({ title, paso }: { title: string; paso: string }) {
  return (
    <>
      <PageHead title={title} />
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="font-heading text-sm font-medium text-foreground">
          Esta pantalla llega en el {paso}.
        </p>
      </div>
    </>
  );
}
