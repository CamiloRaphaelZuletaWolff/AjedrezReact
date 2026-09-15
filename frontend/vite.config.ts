import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        // compiler: true activa el React Compiler, que memoriza los componentes
        // automaticamente al compilar (lo provee el paquete oxc-transform-react).
        react({ compiler: true })
    ],
    server: {
        // En desarrollo el frontend corre en :5173 y el backend en :3000.
        // Este proxy hace que fetch("/api/...") llegue al backend sin CORS,
        // igual que en produccion, donde Express sirve todo desde un solo puerto.
        proxy: {
            "/api": "http://localhost:3000"
        }
    }
});
