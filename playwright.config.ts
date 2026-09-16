import { defineConfig } from "@playwright/test";

// Las mismas pruebas que Cypress, pero con Playwright.
// Por defecto se prueba el servidor local; para probar la app publicada:
//   PLAYWRIGHT_BASE_URL=https://ajedrez-relampago.onrender.com npx playwright test
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const esLocal = baseURL.includes("localhost");

export default defineConfig({
    testDir: "./playwright",
    reporter: "list",

    use: {
        baseURL,
        // Los componentes marcan los elementos con data-cy (los mismos que usa
        // Cypress), asi que se le dice a Playwright que ese es el atributo.
        testIdAttribute: "data-cy",
        // Chrome de verdad, no el Chromium que descarga Playwright.
        // Asi no hay que bajar ningun navegador extra.
        channel: "chrome"
    },

    // Si se prueba en local, Playwright compila y levanta el servidor solo.
    // Si se apunta a la URL publicada, no levanta nada.
    webServer: esLocal
        ? {
              command: "npm run build && npm start",
              url: baseURL,
              reuseExistingServer: true,
              timeout: 120000
          }
        : undefined
});
