import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD_NAMES } from "../src/lib/form-config";
import { isValidCuit, normalizeCuit, validateForm } from "../src/lib/validation";
import { validSubmission } from "./fixtures";

test("all thirteen fields from the previous Google Form are required", () => {
  const result = validateForm({});
  assert.equal(Object.keys(result.errors).length, 13);
  for (const name of FIELD_NAMES) assert.ok(result.errors[name]);
  assert.ok(validateForm(validSubmission).valid);
});

test("CUIT check digit accepts hyphens and digits; rejects wrong length, letters and checksum", () => {
  assert.equal(normalizeCuit(" 30-12345678-1 "), "30123456781");
  assert.ok(isValidCuit("30-12345678-1"));
  assert.ok(isValidCuit("30123456781"));
  for (const value of ["30123456782", "3012345678", "00000000000", "3012345678x", "30.12345678.1"]) assert.equal(isValidCuit(value), false);
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
