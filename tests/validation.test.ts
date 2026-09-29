import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELD_NAMES } from "../src/lib/form-config";
import { isValidCuit, normalizeCuit, normalizeReservation, validateForm } from "../src/lib/validation";
import { validSubmission } from "./fixtures";

test("all thirteen required fields fail independently; commercial name stays optional", () => {
  const result = validateForm({});
  assert.equal(Object.keys(result.errors).length, 13);
  for (const name of FIELD_NAMES.filter((field) => field !== "nombreComercial")) assert.ok(result.errors[name]);
  assert.ok(validateForm({ ...validSubmission, nombreComercial: "" }).valid);
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

test("reservation references are optional, bounded and restricted to identifier characters", () => {
  assert.equal(normalizeReservation(" ABC123 "), "ABC123");
  for (const value of [null, [], "", "x".repeat(101), "person@example.com", "<script>"]) assert.equal(normalizeReservation(value), null);
});
