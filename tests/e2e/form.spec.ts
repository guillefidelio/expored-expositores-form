import { test, expect, type Page } from "@playwright/test";
import { validSubmission } from "../fixtures";
import { FAILURE_MESSAGE, SUCCESS_MESSAGE } from "../../src/lib/form-config";

async function fillFields(page: Page, fields: Record<string, string>) {
  for (const [name, value] of Object.entries(fields)) {
    if (name === "condicionIVA") await page.locator(`#${name}`).selectOption(value);
    else if (name === "formaPago") await page.getByText(value, { exact: true }).click();
    else await page.locator(`#${name}`).fill(value);
  }
}

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:4011/__control", { data: { mode: "success" } }); });

test("matches the previous form fields and validates each onboarding step", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[aria-current="step"]')).toContainText("Datos de la empresa");
  await expect(page.locator("#razonSocial")).toHaveAttribute("required", "");
  await expect(page.locator("#nombreComercial")).toHaveAttribute("required", "");
  await expect(page.locator("#razonSocialFacturacion")).toHaveCount(0);
  await expect(page.getByText("Misma razón social que la empresa")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Facturación y pago/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#razonSocial")).toBeFocused();
  await fillFields(page, { razonSocial: "PRUEBA LOCAL Empresa", nombreComercial: "Empresa de prueba" });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("Datos del expositor");
  await fillFields(page, { responsableStand: "Persona de prueba", telefonoStand: "+54 11 0000 0000", emailStand: "stand@example.invalid", nombreStand: "Stand de prueba" });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("Gestión de pago");
});

test("invalid email, CUIT and payment choices show inline errors", async ({ page }) => {
  await page.goto("/");
  await fillFields(page, { razonSocial: validSubmission.razonSocial, nombreComercial: validSubmission.nombreComercial });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await fillFields(page, { responsableStand: validSubmission.responsableStand, telefonoStand: validSubmission.telefonoStand, emailStand: "incorrecto", nombreStand: validSubmission.nombreStand });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#emailStand-error")).toHaveText("Ingresá un email válido.");
  await expect(page.locator("#emailStand")).toBeFocused();
  await fillFields(page, { responsableStand: validSubmission.responsableStand, telefonoStand: validSubmission.telefonoStand, emailStand: validSubmission.emailStand, nombreStand: validSubmission.nombreStand });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#cuit").fill("30123456782");
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.locator("#cuit-error")).toHaveText("Ingresá un CUIT válido de 11 dígitos.");
  await expect(page.getByRole("radio", { name: "Cheque" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Transferencia" })).toBeVisible();
});

test("successful submission sends only the old Google Form fields and prevents duplicates", async ({ page, request }) => {
  await page.goto("/");
  await fillFields(page, { razonSocial: validSubmission.razonSocial, nombreComercial: validSubmission.nombreComercial });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await fillFields(page, { responsableStand: validSubmission.responsableStand, telefonoStand: validSubmission.telefonoStand, emailStand: validSubmission.emailStand, nombreStand: validSubmission.nombreStand });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await fillFields(page, { responsablePago: validSubmission.responsablePago, telefonoPago: validSubmission.telefonoPago, emailPago: validSubmission.emailPago, cuit: validSubmission.cuit, condicionIVA: validSubmission.condicionIVA, formaPago: validSubmission.formaPago, detalleFactura: validSubmission.detalleFactura });
  await page.getByRole("button", { name: "Enviar datos" }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
  const deliveries = await (await request.get("http://127.0.0.1:4011/__deliveries")).json();
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toMatchObject({ cuit: "30123456781", condicionIVA: "Responsable Inscripto", formaPago: "Transferencia" });
  expect(deliveries[0].reservationReference).toBeUndefined();
  expect(deliveries[0].razonSocialFacturacion).toBeUndefined();
});

test("Make failure preserves values and never shows success", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4011/__control", { data: { mode: "failure" } });
  await page.goto("/");
  await fillFields(page, { razonSocial: validSubmission.razonSocial, nombreComercial: validSubmission.nombreComercial });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await fillFields(page, { responsableStand: validSubmission.responsableStand, telefonoStand: validSubmission.telefonoStand, emailStand: validSubmission.emailStand, nombreStand: validSubmission.nombreStand });
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await fillFields(page, { responsablePago: validSubmission.responsablePago, telefonoPago: validSubmission.telefonoPago, emailPago: validSubmission.emailPago, cuit: validSubmission.cuit, condicionIVA: validSubmission.condicionIVA, formaPago: validSubmission.formaPago, detalleFactura: validSubmission.detalleFactura });
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.getByText(FAILURE_MESSAGE)).toBeVisible();
  await expect(page.locator("#emailPago")).toHaveValue(validSubmission.emailPago);
  await expect(page.getByText(SUCCESS_MESSAGE)).toHaveCount(0);
});

test("mobile layout has no overflow and payment choices are usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/google-form-mobile.png", fullPage: true });
  await expect(page.getByRole("img", { name: "ExpoRed 2027" })).toBeVisible();
});
