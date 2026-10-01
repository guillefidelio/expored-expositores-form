export const IVA_OPTIONS = [
  "Responsable Inscripto",
  "Exento",
] as const;

export const PAYMENT_OPTIONS = ["Cheque", "Transferencia"] as const;
export const RETENTION_OPTIONS = ["Sí", "No"] as const;
export const TAX_OPTIONS = ["IVA", "Ganancias", "Ingresos Brutos", "Otros"] as const;

export const FIELDS = {
  razonSocial: { label: "Razón Social (para la facturación)", maxLength: 180, autoComplete: "section-empresa organization", wide: true },
  nombreComercial: { label: "Nombre Comercial (repetir si es igual a la Razón Social)", maxLength: 180, autoComplete: "organization", wide: true },
  responsableStand: { label: "Nombre y Apellido (del responsable y toma de decisiones sobre el stand)", maxLength: 160, autoComplete: "section-stand name", wide: true },
  telefonoStand: { label: "Teléfono (del responsable y toma de decisiones sobre el stand)", maxLength: 40, type: "tel", autoComplete: "section-stand tel" },
  emailStand: { label: "Mail (del responsable y toma de decisiones sobre el stand)", maxLength: 254, type: "email", autoComplete: "section-stand email" },
  nombreStand: { label: "Nombre del Stand (nombre por el cual será identificado en la Expo, puede ser el mismo al comercial)", maxLength: 180, autoComplete: "off", wide: true },
  responsablePago: { label: "Nombre y Apellido (del responsable del pago)", maxLength: 160, autoComplete: "section-pago name", wide: true },
  telefonoPago: { label: "Teléfono (del responsable del pago)", maxLength: 40, type: "tel", autoComplete: "section-pago tel" },
  emailPago: { label: "Mail (del responsable del pago)", maxLength: 254, type: "email", autoComplete: "section-pago email" },
  cuit: { label: "CUIT", maxLength: 11, autoComplete: "off", hint: "Ingresá los 11 dígitos, sin guiones ni espacios." },
  agenteRetencion: { label: "¿Es agente de retención?", maxLength: 2, type: "choice", autoComplete: "off", options: RETENTION_OPTIONS, wide: true },
  impuestosRetencion: { label: "En caso afirmativo, indique los impuestos:", maxLength: 100, type: "multichoice", autoComplete: "off", options: TAX_OPTIONS, wide: true },
  jurisdiccionIngresosBrutos: { label: "Ingresos Brutos — Jurisdicción", maxLength: 180, autoComplete: "off", wide: true },
  otrosImpuestosRetencion: { label: "Otros — Indique los impuestos", maxLength: 300, autoComplete: "off", wide: true },
  condicionIVA: { label: "Condición frente al IVA", maxLength: 60, type: "select", autoComplete: "off" },
  formaPago: { label: "Forma de pago", maxLength: 30, type: "choice", autoComplete: "off", options: PAYMENT_OPTIONS, wide: true },
  detalleFactura: { label: "Detalle (texto para el cuerpo de la factura)", maxLength: 2000, type: "textarea", autoComplete: "off", wide: true },
} satisfies Record<string, FieldConfig>;

export type FieldConfig = {
  label: string;
  maxLength: number;
  optional?: boolean;
  autoComplete: string;
  type?: string;
  wide?: boolean;
  hint?: string;
  options?: readonly string[];
};
export type FieldName = keyof typeof FIELDS;
export type FormValues = Record<FieldName, string>;
export type FieldErrors = Partial<Record<FieldName, string>>;
export const FIELD_NAMES = Object.keys(FIELDS) as FieldName[];
export const EMPTY_VALUES = Object.fromEntries(FIELD_NAMES.map((name) => [name, ""])) as FormValues;

export function isFieldVisible(name: FieldName, values: Partial<Record<FieldName, unknown>>): boolean {
  if (name === "impuestosRetencion") return values.agenteRetencion === "Sí";
  if (name === "jurisdiccionIngresosBrutos" || name === "otrosImpuestosRetencion") {
    const taxes = typeof values.impuestosRetencion === "string" ? values.impuestosRetencion.split("; ") : [];
    return values.agenteRetencion === "Sí" && taxes.includes(name === "jurisdiccionIngresosBrutos" ? "Ingresos Brutos" : "Otros");
  }
  return true;
}
export const FAILURE_MESSAGE = "No pudimos enviar el formulario. Intentá nuevamente en unos minutos.";
export const SUCCESS_MESSAGE = "Gracias. Recibimos los datos de tu empresa para continuar con el proceso comercial de ExpoRed 2027.";
