import { BrandShell } from "@/components/brand-shell";
import { ExhibitorForm } from "@/components/exhibitor-form";

export default function Home() {
  return (
    <BrandShell>
      <div className="page-intro">
        <p className="eyebrow"><span aria-hidden="true" />TU PARTICIPACIÓN EN EXPORED 2027</p>
        <h1>Datos del Expositor</h1>
        <p className="intro-copy">Completá los datos de tu empresa para continuar con la gestión de tu participación en ExpoRed 2027.</p>
      </div>
      <noscript><p className="submission-error">Activá JavaScript en tu navegador para completar y enviar el formulario.</p></noscript>
      <ExhibitorForm />
    </BrandShell>
  );
}
