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
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const nextValue = event.target.value;
      if (name === "cuit" && !/^[0-9]{0,11}$/.test(nextValue)) return;
      onChange(name, nextValue);
    },
    onBlur: () => onBlur(name),
  };

  return (
    <div className={`field${config.wide ? " field-wide" : ""}`}>
      <label id={`${name}-label`} htmlFor={config.type === "choice" || config.type === "multichoice" ? undefined : name}>
        {config.label}{config.optional ? <span className="optional">Opcional</span> : <span className="required" aria-hidden="true"> *</span>}
      </label>
      {config.type === "choice" ? (
        <div id={name} tabIndex={-1} className="choice-group" role="radiogroup" aria-labelledby={`${name}-label`} aria-required={!config.optional} aria-invalid={Boolean(error)} aria-describedby={props["aria-describedby"]}>
          {config.options?.map((option) => (
            <label className={`choice-option${value === option ? " selected" : ""}`} key={option}>
              <input type="radio" name={name} value={option} checked={value === option} required onChange={() => onChange(name, option)} onBlur={() => onBlur(name)} aria-describedby={props["aria-describedby"]} />
              <span className="choice-dot" aria-hidden="true" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : config.type === "multichoice" ? (
        <div id={name} tabIndex={-1} className="tax-options" role="group" aria-labelledby={`${name}-label`} aria-describedby={props["aria-describedby"]}>
          {config.options?.map((option) => (
            <label className="checkbox-label" key={option}>
              <input type="checkbox" name={name} value={option} checked={value.split("; ").includes(option)} onBlur={() => onBlur(name)} aria-describedby={props["aria-describedby"]} onChange={(event) => {
                const selected = new Set(value ? value.split("; ") : []);
                if (event.target.checked) selected.add(option);
                else selected.delete(option);
                onChange(name, config.options!.filter((tax) => selected.has(tax)).join("; "));
              }} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : config.type === "select" ? (
        <select {...props}>
          <option value="" disabled>Seleccioná una opción</option>
          {IVA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : config.type === "textarea" ? (
        <textarea {...props} maxLength={config.maxLength} rows={4} />
      ) : (
        <input {...props} type={config.type ?? "text"} maxLength={config.maxLength} minLength={name === "cuit" ? 11 : undefined} pattern={name === "cuit" ? "[0-9]{11}" : undefined} inputMode={name === "cuit" ? "numeric" : undefined} spellCheck={config.type === "email" || name === "cuit" ? false : undefined} />
      )}
      {config.hint && <p id={`${name}-hint`} className="field-hint">{config.hint}</p>}
      {error && <p id={`${name}-error`} className="field-error">{error}</p>}
      {children}
    </div>
  );
}
