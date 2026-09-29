const STEPS = ["Datos de la empresa", "Facturación y pago"];

type Props = {
  step: number;
  companyComplete: boolean;
  disabled: boolean;
  onSelect?: (step: number) => void;
};

export function FormProgress({ step, companyComplete, disabled, onSelect }: Props) {
  return (
    <nav className="form-progress" aria-label="Progreso del formulario">
      <ol className={companyComplete ? "progress-list first-complete" : "progress-list"}>
        {STEPS.map((label, index) => {
          const complete = step === 2 || (index === 0 && companyComplete && step !== 0);
          return (
            <li key={label} className={`${step === index ? "step-current" : ""} ${complete ? "step-complete" : ""}`}>
              <button type="button" aria-current={step === index ? "step" : undefined} disabled={disabled} onClick={() => onSelect?.(index)}>
                <span className="step-circle" aria-hidden="true">{complete ? <svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8" /></svg> : `0${index + 1}`}</span>
                <span className="step-label">{label}</span>
                <span className="step-caption">{complete ? "Completado" : step === index ? "Estás acá" : "Siguiente paso"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
