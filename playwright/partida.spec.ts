// -----------------------------------------------------------------------------
// Pruebas end-to-end con Playwright.
// Son las mismas dos pruebas que hay en cypress/e2e/partida.cy.ts: sirven como
// alternativa equivalente, para poder ejecutar la defensa con cualquiera de las
// dos herramientas.
//
// Cubren: el inicio, una validacion, la interaccion principal (mover una pieza),
// la comunicacion real con el backend y un movimiento invalido.
//
// Recordatorio de indices del tablero: 0 = a8 (arriba izquierda), 63 = h1.
//   e2 = 52    e4 = 36    a7 = 8    h5 = 31
// -----------------------------------------------------------------------------

import { expect, test } from "@playwright/test";

test("no deja empezar la partida sin nombres", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /ajedrez relampago/i })).toBeVisible();

    await page.getByRole("button", { name: /empezar partida/i }).click();
    await expect(page.getByTestId("error")).toContainText("nombre");
});

test("crea la partida, mueve un peon y rechaza un movimiento invalido", async ({ page }) => {
    // --- Inicio ---
    await page.goto("/");
    await page.locator("#blancas").fill("Ana");
    await page.locator("#negras").fill("Beto");

    // La partida la crea el backend: se espera la respuesta HTTP real.
    const crear = page.waitForResponse(
        (r) => r.url().endsWith("/api/partidas") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: /empezar partida/i }).click();
    expect((await crear).status()).toBe(201);

    await expect(page.getByTestId("tablero")).toBeVisible();
    await expect(page.getByTestId("turno")).toContainText("Ana");
    await expect(page.getByTestId("energia-blancas")).toContainText("6");
    await expect(page.getByTestId("panel-blancas")).toContainText("Mision");

    // --- Interaccion principal: mover el peon de e2 a e4 ---
    await page.getByTestId("casilla-52").click();
    await expect(page.getByTestId("casilla-36")).toHaveClass(/destino/);

    const mover = page.waitForResponse(
        (r) => r.url().includes("/movimientos") && r.request().method() === "POST"
    );
    await page.getByTestId("casilla-36").click();
    expect((await mover).status()).toBe(200);

    // El estado que devolvio el servidor se ve en la interfaz.
    await expect(page.getByTestId("turno")).toContainText("Beto");
    await expect(page.getByTestId("energia-blancas")).toContainText("5");
    await expect(page.getByTestId("jugadas")).toContainText("e2 a e4");

    // --- El endpoint GET tambien se usa de verdad ---
    const leer = page.waitForResponse(
        (r) => /\/api\/partidas\/[^/]+$/.test(r.url()) && r.request().method() === "GET"
    );
    await page.getByTestId("boton-actualizar").click();
    expect((await leer).status()).toBe(200);

    // --- Caso invalido: un peon de a7 no puede saltar a h5 ---
    const invalido = page.waitForResponse(
        (r) => r.url().includes("/movimientos") && r.request().method() === "POST"
    );
    await page.getByTestId("casilla-8").click();
    await page.getByTestId("casilla-31").click();
    expect((await invalido).status()).toBe(400);

    await expect(page.getByTestId("error")).toContainText("no puede moverse");

    // El turno no cambio porque la jugada fue rechazada.
    await expect(page.getByTestId("turno")).toContainText("Beto");
});
