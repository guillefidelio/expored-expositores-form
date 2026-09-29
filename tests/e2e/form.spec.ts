import { test, expect, type Page } from "@playwright/test";
import { validSubmission } from "../fixtures";
import { FAILURE_MESSAGE, SUCCESS_MESSAGE } from "../../src/lib/form-config";

async function fillValid(page: Page) {
  for (const [name, value] of Object.entries(validSubmission)) {
    if (name === "razonSocialFacturacion") await page.getByRole("button", { name: "Continuar", exact: true }).click();
    if (name === "condicionIVA") await page.locator(`#${name}`).selectOption(value);
    else await page.locator(`#${name}`).fill(value);
  }
}

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:4011/__control", { data: { mode: "success" } }); });

test("required, email and CUIT errors are inline, accessible, and preserve entered values", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("[aria-invalid=true]")).toHaveCount(5);
  await expect(page.locator("#razonSocial")).toBeFocused();
  await page.locator("#emailStand").fill("incorrecto");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#emailStand-error")).toHaveText("Ingresá un email válido.");
  await expect(page.locator("#emailStand")).toHaveAttribute("aria-describedby", "emailStand-error");
  await fillValid(page);
  await page.locator("#emailPago").fill("incorrecto");
  await page.locator("#cuit").fill("30123456782");
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.locator("#emailPago-error")).toHaveText("Ingresá un email válido.");
  await expect(page.locator("#cuit-error")).toHaveText("Ingresá un CUIT válido de 11 dígitos.");
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(page.locator("#razonSocial")).toHaveValue(validSubmission.razonSocial);
});

test("billing copy follows the company until manually edited", async ({ page }) => {
  await page.goto("/");
  await fillValid(page);
  await page.getByRole("checkbox").check();
  await expect(page.locator("#razonSocialFacturacion")).toHaveValue(validSubmission.razonSocial);
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.locator("#razonSocial").fill("PRUEBA LOCAL Dos");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#razonSocialFacturacion")).toHaveValue("PRUEBA LOCAL Dos");
  await page.locator("#razonSocialFacturacion").fill("PRUEBA LOCAL Distinta");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.locator("#razonSocial").fill("PRUEBA LOCAL Tres");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#razonSocialFacturacion")).toHaveValue("PRUEBA LOCAL Distinta");
});

test("real local API forwards reservation, prevents duplicate clicks and shows confirmed success", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?reserva=ABC123");
  await fillValid(page);
  await page.getByRole("button", { name: "Enviar datos" }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole("button", { name: "Enviando datos" })).toBeDisabled();
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Datos enviados" })).toBeVisible();
  await expect(page.locator(".success-card")).toBeFocused();
  await expect(page.locator(".step-complete")).toHaveCount(2);
  const deliveries = await (await request.get("http://127.0.0.1:4011/__deliveries")).json();
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toMatchObject({ reservationReference: "ABC123", cuit: "30123456781" });
  expect(errors).toEqual([]);
});

test("Make failure preserves the form; retry reuses the same submission ID and works without reservation", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4011/__control", { data: { mode: "failure" } });
  await page.goto("/");
  await fillValid(page);
  const rejected = page.waitForResponse("**/api/expositores");
  await page.getByRole("button", { name: "Enviar datos" }).click();
  expect((await rejected).status()).toBe(502);
  await expect(page.getByText(FAILURE_MESSAGE)).toBeVisible();
  await expect(page.locator("#emailPago")).toHaveValue(validSubmission.emailPago);
  await expect(page.getByRole("button", { name: "Enviar datos" })).toBeEnabled();
  await expect(page.getByText(SUCCESS_MESSAGE)).toHaveCount(0);
  const before = await (await request.get("http://127.0.0.1:4011/__deliveries")).json();
  expect(before).toHaveLength(1);
  await request.post("http://127.0.0.1:4011/__control", { data: { mode: "success" } });
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
  const after = await (await request.get("http://127.0.0.1:4011/__deliveries")).json();
  expect(after[0].submissionId).toBe(before[0].submissionId);
  expect(after[0].reservationReference).toBeNull();
});

test("real Make timeout shows failure and leaves data editable", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4011/__control", { data: { mode: "timeout" } });
  await page.goto("/");
  await fillValid(page);
  const timedOut = page.waitForResponse("**/api/expositores");
  await page.getByRole("button", { name: "Enviar datos" }).click();
  expect((await timedOut).status()).toBe(504);
  await expect(page.getByText(FAILURE_MESSAGE)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#detalleFactura")).toBeEditable();
  await expect(page.getByText(SUCCESS_MESSAGE)).toHaveCount(0);
});

test("mobile layout at 375 and 320px has no overflow, readable controls and working submission", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("img", { name: "ExpoRed 2027" })).toBeVisible();
  expect(await page.locator(".brand-logo").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/mobile-375.png", fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator("#razonSocial").evaluate((input) => getComputedStyle(input).fontSize)).toBe("16px");
  await fillValid(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/mobile-step-2.png", fullPage: true });
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
});

test("desktop renders without runtime errors or overflow", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Datos del Expositor" })).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("step navigation validates before advancing, retains data and does not submit early", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('[aria-current="step"]')).toContainText("Datos de la empresa");
  await page.getByRole("button", { name: /Facturación y pago/ }).click();
  await expect(page.locator("#razonSocial")).toBeFocused();
  await expect(page.locator("#cuit")).toHaveCount(0);
  await fillValid(page);
  await expect(page.locator('[aria-current="step"]')).toContainText("Facturación y pago");
  await expect(page.locator(".step-complete")).toHaveCount(1);
  await page.screenshot({ path: "artifacts/desktop-step-2.png", fullPage: true });
  await page.getByRole("button", { name: /Datos de la empresa/ }).click();
  await expect(page.locator("#step-heading")).toBeFocused();
  await expect(page.locator("#nombreStand")).toHaveValue(validSubmission.nombreStand);
  await page.locator("#nombreStand").press("Enter");
  await expect(page.locator("#cuit")).toHaveValue(validSubmission.cuit);
  await expect(page.locator("#step-heading")).toBeFocused();
  expect(await (await request.get("http://127.0.0.1:4011/__deliveries")).json()).toHaveLength(0);
});

test("server field errors navigate back to the affected section", async ({ page }) => {
  await page.goto("/");
  await fillValid(page);
  await page.route("**/api/expositores", (route) => route.fulfill({ status: 422, json: { ok: false, errors: { emailStand: "Ingresá un email válido." } } }));
  await page.getByRole("button", { name: "Enviar datos" }).click();
  await expect(page.locator("#emailStand")).toBeFocused();
  await expect(page.locator("#emailStand-error")).toBeVisible();
  await expect(page.locator("#razonSocial")).toHaveValue(validSubmission.razonSocial);
});
