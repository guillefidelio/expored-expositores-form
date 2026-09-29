"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EMPTY_VALUES, FAILURE_MESSAGE, FIELD_NAMES, SUCCESS_MESSAGE, type FieldErrors, type FieldName, type FormValues } from "@/lib/form-config";
import { validateForm } from "@/lib/validation";
import { FormField } from "./form-field";
import { FormProgress } from "./form-progress";

const STEP_FIELDS = [
  FIELD_NAMES.slice(0, 2),
  FIELD_NAMES.slice(2, 6),
  FIELD_NAMES.slice(6),
] as const;

export function ExhibitorForm() {
  const [values, setValues] = useState<FormValues>({ ...EMPTY_VALUES });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");
  const [validationNotice, setValidationNotice] = useState(false);
  const [step, setStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([]);
  const sending = useRef(false);
  const attemptKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const currentValidation = validateForm(values);
  const completedSteps = STEP_FIELDS.map((fields, index) => visitedSteps.includes(index) && fields.every((name) => !currentValidation.errors[name]));

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function update(name: FieldName, value: string) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function blur(name: FieldName) {
    setErrors((previous) => ({ ...previous, [name]: validateForm(values).errors[name] }));
  }

  function focusFirstError(nextErrors: FieldErrors) {
    const name = FIELD_NAMES.find((field) => nextErrors[field]);
    if (name) {
      setStep(STEP_FIELDS.findIndex((fields) => fields.includes(name)));
      requestAnimationFrame(() => document.getElementById(name)?.focus());
    }
  }

  function changeStep(nextStep: number) {
    if (sending.current) return;
    if (nextStep > step) {
      const validation = validateForm(values);
      const currentErrors: FieldErrors = {};
      for (const name of STEP_FIELDS[step]) if (validation.errors[name]) currentErrors[name] = validation.errors[name];
      if (Object.keys(currentErrors).length) {
        setErrors(currentErrors);
        setValidationNotice(true);
        focusFirstError(currentErrors);
        return;
      }
      setVisitedSteps((previous) => previous.includes(step) ? previous : [...previous, step]);
    }
    setStep(nextStep);
    setValidationNotice(false);
    setStatus("idle");
    requestAnimationFrame(() => {
      const heading = document.getElementById("step-heading");
      heading?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ block: "start" });
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    if (step < STEP_FIELDS.length - 1) {
      changeStep(step + 1);
      return;
    }
    const result = validateForm(values);
    setErrors(result.errors);
    setValidationNotice(!result.valid);
    if (!result.valid) {
      setStatus("idle");
      focusFirstError(result.errors);
      return;
    }
    sending.current = true;
    setStatus("sending");
    try {
      attemptKey.current ??= crypto.randomUUID();
      const website = new FormData(formRef.current!).get("website") ?? "";
      const response = await fetch("/api/expositores", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attemptKey.current },
        body: JSON.stringify({ ...result.data, website }),
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.json();
      if (response.ok && body.ok === true) {
        setValues({ ...EMPTY_VALUES });
        setStatus("success");
      } else if (response.status === 422 && body.errors && typeof body.errors === "object") {
        const safeErrors: FieldErrors = {};
        for (const name of FIELD_NAMES) if (typeof body.errors[name] === "string") safeErrors[name] = body.errors[name];
        setErrors(safeErrors);
        setValidationNotice(true);
        setStatus("idle");
        focusFirstError(safeErrors);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      sending.current = false;
    }
  }

  if (status === "success") {
    return (
      <>
      <FormProgress step={3} completedSteps={[true, true, true]} disabled />
      <div className="success-card" ref={successRef} tabIndex={-1} role="status">
        <span className="success-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="m8 16 5 5 11-11" /></svg></span>
        <p className="eyebrow">EXPORED 2027</p>
        <h2>Datos enviados</h2>
        <p>{SUCCESS_MESSAGE}</p>
      </div>
      </>
    );
  }

  const renderField = (name: FieldName) => <FormField key={name} name={name} value={values[name]} error={errors[name]} onChange={update} onBlur={blur} />;

  return (
    <>
    <FormProgress step={step} completedSteps={completedSteps} disabled={status === "sending"} onSelect={changeStep} />
    <form ref={formRef} noValidate onSubmit={submit} className="form-surface" aria-busy={status === "sending"}>
      <div className="form-note"><span className="step-counter">PASO {step + 1} DE 3</span><span>Los campos con <strong>*</strong> son obligatorios.</span></div>
      <fieldset className="form-section" disabled={status === "sending"}>
        <legend id="step-heading" tabIndex={-1}>{["Datos de la empresa", "Datos del expositor", "Gestión de pago"][step]}</legend>
        <p className="section-description">{["Razón social y nombre comercial de tu empresa.", "Datos del responsable que toma las decisiones sobre el stand.", "Información de la persona responsable del pago y la factura."][step]}</p>
        <div className="fields-grid">{STEP_FIELDS[step].map(renderField)}</div>
      </fieldset>
      <div className="honeypot" aria-hidden="true" inert>
        <label htmlFor="website">Dejá este campo vacío</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={200} />
      </div>
      <div className="form-submit">
        {validationNotice && <p className="validation-notice" role="alert">Revisá los campos indicados para poder enviar tus datos.</p>}
        {status === "error" && <p className="submission-error" role="alert">{FAILURE_MESSAGE}</p>}
        <div className="submit-row">
          {step === 0 ? <p>A continuación: datos del expositor.</p> : <button type="button" className="back-button" disabled={status === "sending"} onClick={() => changeStep(step - 1)}><span aria-hidden="true">←</span> Volver</button>}
          <button type="submit" className="submit-button" disabled={status === "sending"}>
            {status === "sending" ? <><span className="spinner" aria-hidden="true" />Enviando datos…</> : step < STEP_FIELDS.length - 1 ? <>Continuar <span aria-hidden="true">→</span></> : <>Enviar datos <span aria-hidden="true">↗</span></>}
          </button>
        </div>
        <span className="sr-only" role="status">{status === "sending" ? "Enviando los datos. Esperá un momento." : ""}</span>
      </div>
    </form>
    </>
  );
}
