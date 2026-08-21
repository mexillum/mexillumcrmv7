export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="font-heading text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}
