export const IVA_OPTIONS = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "Consumidor Final",
  "Otro",
] as const;

export const FIELDS = {
  razonSocial: { label: "Razón Social", maxLength: 180, autoComplete: "section-empresa organization" },
  nombreComercial: { label: "Nombre Comercial", maxLength: 180, optional: true, autoComplete: "off" },
  responsableStand: { label: "Nombre y Apellido del responsable del stand", maxLength: 160, autoComplete: "section-stand name", wide: true },
  telefonoStand: { label: "Teléfono del responsable del stand", maxLength: 40, type: "tel", autoComplete: "section-stand tel" },
  emailStand: { label: "Email del responsable del stand", maxLength: 254, type: "email", autoComplete: "section-stand email" },
  nombreStand: { label: "Nombre con el que se identificará el stand en ExpoRed", maxLength: 180, autoComplete: "off", wide: true },
  razonSocialFacturacion: { label: "Razón Social para facturación", maxLength: 180, autoComplete: "section-facturacion organization", wide: true },
  responsablePago: { label: "Nombre y Apellido del responsable del pago", maxLength: 160, autoComplete: "section-pago name", wide: true },
  telefonoPago: { label: "Teléfono del responsable del pago", maxLength: 40, type: "tel", autoComplete: "section-pago tel" },
  emailPago: { label: "Email del responsable del pago", maxLength: 254, type: "email", autoComplete: "section-pago email" },
  cuit: { label: "CUIT", maxLength: 13, autoComplete: "off", hint: "Ingresalo con o sin guiones." },
  condicionIVA: { label: "Condición frente al IVA", maxLength: 60, type: "select", autoComplete: "off" },
  formaPago: { label: "Forma de pago", maxLength: 250, autoComplete: "off", wide: true },
  detalleFactura: { label: "Detalle / texto para el cuerpo de la factura", maxLength: 2000, type: "textarea", autoComplete: "off", wide: true },
} satisfies Record<string, FieldConfig>;

export type FieldConfig = {
  label: string;
  maxLength: number;
  optional?: boolean;
  autoComplete: string;
  type?: string;
  wide?: boolean;
  hint?: string;
};
export type FieldName = keyof typeof FIELDS;
export type FormValues = Record<FieldName, string>;
export type FieldErrors = Partial<Record<FieldName, string>>;
export const FIELD_NAMES = Object.keys(FIELDS) as FieldName[];
export const EMPTY_VALUES = Object.fromEntries(FIELD_NAMES.map((name) => [name, ""])) as FormValues;
export const FAILURE_MESSAGE = "No pudimos enviar el formulario. Intentá nuevamente en unos minutos.";
export const SUCCESS_MESSAGE = "Gracias. Recibimos los datos de tu empresa para continuar con el proceso comercial de ExpoRed 2027.";
