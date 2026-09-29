"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EMPTY_VALUES, FAILURE_MESSAGE, FIELD_NAMES, SUCCESS_MESSAGE, type FieldErrors, type FieldName, type FormValues } from "@/lib/form-config";
import { normalizeReservation, validateForm } from "@/lib/validation";
import { FormField } from "./form-field";
import { FormProgress } from "./form-progress";

const COMPANY_FIELDS = FIELD_NAMES.slice(0, 6);
const BILLING_FIELDS = FIELD_NAMES.slice(6);

export function ExhibitorForm() {
  const [values, setValues] = useState<FormValues>({ ...EMPTY_VALUES });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sameCompany, setSameCompany] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error" | "success">("idle");
  const [validationNotice, setValidationNotice] = useState(false);
  const [step, setStep] = useState(0);
  const [visitedBilling, setVisitedBilling] = useState(false);
  const sending = useRef(false);
  const attemptKey = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const currentValidation = validateForm(values);
  const companyComplete = visitedBilling && COMPANY_FIELDS.every((name) => !currentValidation.errors[name]);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  function update(name: FieldName, value: string) {
    setValues((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "razonSocial" && sameCompany ? { razonSocialFacturacion: value } : {}),
    }));
    if (name === "razonSocialFacturacion") setSameCompany(false);
    setErrors((previous) => ({ ...previous, [name]: undefined, ...(name === "razonSocial" && sameCompany ? { razonSocialFacturacion: undefined } : {}) }));
  }

  function blur(name: FieldName) {
    setErrors((previous) => ({ ...previous, [name]: validateForm(values).errors[name] }));
  }

  function focusFirstError(nextErrors: FieldErrors) {
    const name = FIELD_NAMES.find((field) => nextErrors[field]);
    if (name) {
      setStep(COMPANY_FIELDS.includes(name) ? 0 : 1);
      requestAnimationFrame(() => document.getElementById(name)?.focus());
    }
  }

  function changeStep(nextStep: number) {
    if (sending.current) return;
    if (nextStep === 1) {
      const validation = validateForm(values);
      const companyErrors: FieldErrors = {};
      for (const name of COMPANY_FIELDS) if (validation.errors[name]) companyErrors[name] = validation.errors[name];
      if (Object.keys(companyErrors).length) {
        setErrors(companyErrors);
        setValidationNotice(true);
        focusFirstError(companyErrors);
        return;
      }
      setVisitedBilling(true);
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
    if (step === 0) {
      changeStep(1);
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
      const reservationReference = normalizeReservation(new URLSearchParams(window.location.search).get("reserva"));
      const website = new FormData(formRef.current!).get("website") ?? "";
      const response = await fetch("/api/expositores", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attemptKey.current },
        body: JSON.stringify({ ...result.data, reservationReference, website }),
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
      <FormProgress step={2} companyComplete disabled />
      <div className="success-card" ref={successRef} tabIndex={-1} role="status">
        <span className="success-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="m8 16 5 5 11-11" /></svg></span>
        <p className="eyebrow">EXPORED 2027</p>
        <h2>Datos enviados</h2>
        <p>{SUCCESS_MESSAGE}</p>
      </div>
      </>
    );
  }

  const renderField = (name: FieldName) => (
    <FormField key={name} name={name} value={values[name]} error={errors[name]} onChange={update} onBlur={blur}>
      {name === "razonSocialFacturacion" && (
        <label className="checkbox-label">
          <input type="checkbox" checked={sameCompany} onChange={(event) => {
            const checked = event.target.checked;
            setSameCompany(checked);
            if (checked) {
              setValues((previous) => ({ ...previous, razonSocialFacturacion: previous.razonSocial }));
              setErrors((previous) => ({ ...previous, razonSocialFacturacion: undefined }));
            }
          }} />
          <span>Misma razón social que la empresa</span>
        </label>
      )}
    </FormField>
  );

  return (
    <>
    <FormProgress step={step} companyComplete={companyComplete} disabled={status === "sending"} onSelect={changeStep} />
    <form ref={formRef} noValidate onSubmit={submit} className="form-surface" aria-busy={status === "sending"}>
      <div className="form-note"><span className="step-counter">PASO {step + 1} DE 2</span><span>Los campos con <strong>*</strong> son obligatorios.</span></div>
      <fieldset className="form-section" disabled={status === "sending"}>
        <legend id="step-heading" tabIndex={-1}>{step === 0 ? "Datos de la empresa" : "Facturación y pago"}</legend>
        <p className="section-description">{step === 0 ? "Empecemos por tu empresa y el contacto para coordinar el stand." : "Un último paso: completá la información para emitir tu factura."}</p>
        <div className="fields-grid">{(step === 0 ? COMPANY_FIELDS : BILLING_FIELDS).map(renderField)}</div>
      </fieldset>
      <div className="honeypot" aria-hidden="true" inert>
        <label htmlFor="website">Dejá este campo vacío</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" maxLength={200} />
      </div>
      <div className="form-submit">
        {validationNotice && <p className="validation-notice" role="alert">Revisá los campos indicados para poder enviar tus datos.</p>}
        {status === "error" && <p className="submission-error" role="alert">{FAILURE_MESSAGE}</p>}
        <div className="submit-row">
          {step === 0 ? <p>A continuación: facturación y pago.</p> : <button type="button" className="back-button" disabled={status === "sending"} onClick={() => changeStep(0)}><span aria-hidden="true">←</span> Volver</button>}
          <button type="submit" className="submit-button" disabled={status === "sending"}>
            {status === "sending" ? <><span className="spinner" aria-hidden="true" />Enviando datos…</> : step === 0 ? <>Continuar <span aria-hidden="true">→</span></> : <>Enviar datos <span aria-hidden="true">↗</span></>}
          </button>
        </div>
        <span className="sr-only" role="status">{status === "sending" ? "Enviando los datos. Esperá un momento." : ""}</span>
      </div>
    </form>
    </>
  );
}
