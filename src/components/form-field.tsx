import type { ReactNode } from "react";
import { FIELDS, IVA_OPTIONS, type FieldConfig, type FieldName } from "@/lib/form-config";

type Props = {
  name: FieldName;
  value: string;
  error?: string;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
  children?: ReactNode;
};

export function FormField({ name, value, error, onChange, onBlur, children }: Props) {
  const config: FieldConfig = FIELDS[name];
  const props = {
    id: name,
    name,
    value,
    required: !config.optional,
    autoComplete: config.autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": [config.hint ? `${name}-hint` : "", error ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(name, event.target.value),
    onBlur: () => onBlur(name),
  };

  return (
    <div className={`field${config.wide ? " field-wide" : ""}`}>
      <label htmlFor={name}>
        {config.label}{config.optional ? <span className="optional">Opcional</span> : <span className="required" aria-hidden="true"> *</span>}
      </label>
      {config.type === "select" ? (
        <select {...props}>
          <option value="" disabled>Seleccioná una opción</option>
          {IVA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : config.type === "textarea" ? (
        <textarea {...props} maxLength={config.maxLength} rows={4} />
      ) : (
        <input {...props} type={config.type ?? "text"} maxLength={config.maxLength} inputMode={name === "cuit" ? "numeric" : undefined} spellCheck={config.type === "email" || name === "cuit" ? false : undefined} />
      )}
      {config.hint && <p id={`${name}-hint`} className="field-hint">{config.hint}</p>}
      {error && <p id={`${name}-error`} className="field-error">{error}</p>}
      {children}
    </div>
  );
}
