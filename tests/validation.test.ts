import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD_NAMES, isFieldVisible } from "../src/lib/form-config";
import { isValidCuit, normalizeCuit, validateForm } from "../src/lib/validation";
import { validSubmission } from "./fixtures";

test("the original fields and retention question are required; conditional fields start hidden", () => {
  const result = validateForm({});
  assert.equal(Object.keys(result.errors).length, 14);
  for (const name of FIELD_NAMES) assert.equal(Boolean(result.errors[name]), isFieldVisible(name, {}));
  assert.ok(validateForm(validSubmission).valid);
});

test("retention taxes and their details are required only when selected", () => {
  assert.ok(validateForm({ ...validSubmission, agenteRetencion: "Tal vez" }).errors.agenteRetencion);
  const agent = { ...validSubmission, agenteRetencion: "Sí" };
  assert.ok(validateForm(agent).errors.impuestosRetencion);
  assert.ok(validateForm({ ...agent, impuestosRetencion: "IVA; Ganancias" }).valid);
  for (const impuestosRetencion of ["Desconocido", "IVA; IVA", ["IVA"], 123]) {
    assert.ok(validateForm({ ...agent, impuestosRetencion }).errors.impuestosRetencion);
  }
  const details = { ...agent, impuestosRetencion: "IVA; Ganancias; Ingresos Brutos; Otros" };
  assert.ok(validateForm(details).errors.jurisdiccionIngresosBrutos);
  assert.ok(validateForm(details).errors.otrosImpuestosRetencion);
  const complete = { ...details, jurisdiccionIngresosBrutos: " Buenos Aires ", otrosImpuestosRetencion: " Impuesto de prueba " };
  const result = validateForm(complete);
  assert.ok(result.valid);
  assert.equal(result.data.jurisdiccionIngresosBrutos, "Buenos Aires");
  assert.equal(result.data.otrosImpuestosRetencion, "Impuesto de prueba");
  assert.ok(validateForm({ ...complete, otrosImpuestosRetencion: "x".repeat(301) }).errors.otrosImpuestosRetencion);
  const no = validateForm({ ...complete, agenteRetencion: "No" });
  assert.ok(no.valid);
  assert.equal(no.data.impuestosRetencion, "");
  assert.equal(no.data.jurisdiccionIngresosBrutos, "");
  assert.equal(no.data.otrosImpuestosRetencion, "");
  const ivaOnly = validateForm({ ...complete, impuestosRetencion: "IVA" });
  assert.ok(ivaOnly.valid);
  assert.equal(ivaOnly.data.jurisdiccionIngresosBrutos, "");
  assert.equal(ivaOnly.data.otrosImpuestosRetencion, "");
});

test("CUIT requires eleven digits and a valid checksum; rejects hyphens and letters", () => {
  assert.equal(normalizeCuit(" 30123456781 "), "30123456781");
  assert.ok(isValidCuit("30123456781"));
  for (const value of ["30123456782", "3012345678", "301234567811", "00000000000", "3012345678x", "30.12345678.1", "30-12345678-1"]) {
    assert.equal(isValidCuit(value), false);
    assert.ok(validateForm({ ...validSubmission, cuit: value }).errors.cuit);
  }
});

test("both email fields, phone fields, IVA and typed values are validated", () => {
  for (const name of ["emailStand", "emailPago"] as const) assert.ok(validateForm({ ...validSubmission, [name]: "mal@" }).errors[name]);
  for (const name of ["telefonoStand", "telefonoPago"] as const) assert.ok(validateForm({ ...validSubmission, [name]: "hola" }).errors[name]);
  assert.ok(validateForm({ ...validSubmission, condicionIVA: "Unknown" }).errors.condicionIVA);
  assert.ok(validateForm({ ...validSubmission, nombreComercial: {} }).errors.nombreComercial);
  assert.ok(validateForm({ ...validSubmission, razonSocial: "x".repeat(181) }).errors.razonSocial);
});

test("normalization trims edges but preserves meaningful multiline invoice text", () => {
  const result = validateForm({ ...validSubmission, razonSocial: " Empresa ", detalleFactura: " Línea 1\nLínea 2 " });
  assert.ok(result.valid);
  assert.equal(result.data.razonSocial, "Empresa");
  assert.equal(result.data.detalleFactura, "Línea 1\nLínea 2");
  assert.equal(result.data.cuit, "30123456781");
});

test("only the requested IVA values and payment methods are accepted", () => {
  for (const value of ["Responsable Inscripto", "Exento"]) assert.ok(validateForm({ ...validSubmission, condicionIVA: value }).valid);
  for (const value of ["Monotributista", "Consumidor Final", "Otro"]) assert.ok(validateForm({ ...validSubmission, condicionIVA: value }).errors.condicionIVA);
  for (const value of ["Cheque", "Transferencia"]) assert.ok(validateForm({ ...validSubmission, formaPago: value }).valid);
  assert.ok(validateForm({ ...validSubmission, formaPago: "Efectivo" }).errors.formaPago);
});
