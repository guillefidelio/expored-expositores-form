import { FIELDS, FIELD_NAMES, IVA_OPTIONS, PAYMENT_OPTIONS, type FieldConfig, type FieldErrors, type FormValues } from "./form-config";

export function normalizeCuit(value: string): string {
  return value.trim().replace(/-/g, "");
}
export function isValidCuit(value: string): boolean {
  const digits = normalizeCuit(value);
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
  const check = (11 - (sum % 11)) % 11;
  return check !== 10 && check === Number(digits[10]);
}

export function validateForm(input: unknown): { data: FormValues; errors: FieldErrors; valid: boolean } {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const errors: FieldErrors = {};
  const data = {} as FormValues;
  for (const name of FIELD_NAMES) {
    const config: FieldConfig = FIELDS[name];
    const value = raw[name];
    data[name] = typeof value === "string" ? value.trim() : "";
    if (value !== undefined && typeof value !== "string") {
      errors[name] = "Ingresá un valor válido.";
    } else if (!data[name] && !config.optional) {
      errors[name] = "Completá este campo.";
    } else if (data[name].length > config.maxLength) {
      errors[name] = `Usá hasta ${config.maxLength} caracteres.`;
    } else if (data[name] && /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(data[name])) {
      errors[name] = "Ingresá un valor válido.";
    } else if (config.type === "email" && data[name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[name])) {
      errors[name] = "Ingresá un email válido.";
    } else if (config.type === "tel" && data[name] && (!/^[+\d\s().-]+$/.test(data[name]) || data[name].replace(/\D/g, "").length < 6 || data[name].replace(/\D/g, "").length > 20)) {
      errors[name] = "Ingresá un teléfono válido, con código de área.";
    }
  }
  if (data.cuit && !errors.cuit && !isValidCuit(data.cuit)) errors.cuit = "Ingresá un CUIT válido de 11 dígitos.";
  data.cuit = normalizeCuit(data.cuit);
  if (data.condicionIVA && !(IVA_OPTIONS as readonly string[]).includes(data.condicionIVA)) errors.condicionIVA = "Seleccioná una condición frente al IVA válida.";
  if (data.formaPago && !(PAYMENT_OPTIONS as readonly string[]).includes(data.formaPago)) errors.formaPago = "Seleccioná una forma de pago válida.";
  return { data, errors, valid: Object.keys(errors).length === 0 };
}

