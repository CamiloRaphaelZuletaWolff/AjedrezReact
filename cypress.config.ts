import { defineConfig } from "cypress";

export default defineConfig({
    // No se usa Cypress.env() en las pruebas; desactivarlo quita un aviso al arrancar.
    allowCypressEnv: false,
    e2e: {
        // Por defecto se prueba el servidor local (Express sirviendo el frontend).
        // Para probar la aplicacion publicada:
        //   CYPRESS_BASE_URL=https://mi-app.onrender.com npx cypress run --browser chrome
        baseUrl: "http://localhost:3000",
        supportFile: false,
        video: false
    }
});
