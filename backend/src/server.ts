// -----------------------------------------------------------------------------
// server.ts  -  Servidor Express de "Ajedrez Relampago".
//
// Responsabilidades del backend:
//   1. Crear la partida y sortear la mision aleatoria (estado inicial).
//   2. Validar y aplicar cada movimiento (turno, reglas, energia, fin de partida).
//   3. Guardar el estado de las partidas y entregar el historial de las terminadas.
//   4. Servir el frontend ya compilado, para que todo viva en un solo puerto.
// -----------------------------------------------------------------------------

import express from "express";
import path from "node:path";
import { crearPartida, aplicarMovimiento, vistaPartida, type Partida } from "./juego.js";

const app = express();
// Render (y cualquier hosting) entrega el puerto por variable de entorno.
const puerto = Number(process.env.PORT ?? 3000);

// Convierte el body JSON de la peticion en un objeto (req.body).
app.use(express.json());

// Las partidas viven en memoria del servidor. Es suficiente para este proyecto:
// si el servidor se reinicia, las partidas en curso se pierden (ver docs/decisiones.md).
const partidas = new Map<string, Partida>();
const historial: {
    id: string;
    jugadores: Record<string, string>;
    ganador: string | null;
    puntos: Record<string, number>;
    turnos: number;
}[] = [];
let contadorDePartidas = 0;

// --- API ---------------------------------------------------------------------

// POST /api/partidas  -> crea una partida nueva.
app.post("/api/partidas", (req, res) => {
    const blancas = String(req.body?.blancas ?? "").trim();
    const negras = String(req.body?.negras ?? "").trim();

    // Caso invalido: formulario vacio.
    if (blancas === "" || negras === "") {
        res.status(400).json({ error: "Los dos jugadores necesitan un nombre" });
        return;
    }

    contadorDePartidas += 1;
    const id = "p" + contadorDePartidas;
    const partida = crearPartida(id, blancas, negras);
    partidas.set(id, partida);

    res.status(201).json(vistaPartida(partida));
});

// GET /api/partidas/:id  -> estado actual de una partida.
app.get("/api/partidas/:id", (req, res) => {
    const partida = partidas.get(req.params.id);
    if (partida === undefined) {
        res.status(404).json({ error: "Esa partida no existe" });
        return;
    }
    res.json(vistaPartida(partida));
});

// POST /api/partidas/:id/movimientos  -> intenta mover una pieza.
app.post("/api/partidas/:id/movimientos", (req, res) => {
    const partida = partidas.get(req.params.id);
    if (partida === undefined) {
        res.status(404).json({ error: "Esa partida no existe" });
        return;
    }

    const desde = Number(req.body?.desde);
    const hasta = Number(req.body?.hasta);

    const error = aplicarMovimiento(partida, desde, hasta);
    if (error !== null) {
        res.status(400).json({ error });
        return;
    }

    // Si la partida acaba de terminar se guarda una linea en el historial.
    if (partida.estado === "terminada") {
        historial.unshift({
            id: partida.id,
            jugadores: partida.jugadores,
            ganador: partida.ganador,
            puntos: partida.puntos,
            turnos: partida.turnosJugados
        });
    }

    res.json(vistaPartida(partida));
});

// GET /api/historial  -> ultimas partidas terminadas.
app.get("/api/historial", (_req, res) => {
    res.json({ historial: historial.slice(0, 10) });
});

// --- Frontend compilado -------------------------------------------------------
// Express sirve los archivos que Vite dejo en frontend/dist, asi el juego
// completo (frontend + backend) queda bajo el mismo dominio y puerto.
const carpetaFrontend = path.join(import.meta.dirname, "..", "..", "frontend", "dist");
app.use(express.static(carpetaFrontend));

// Cualquier otra ruta devuelve el index.html del frontend.
app.use((_req, res) => {
    res.sendFile(path.join(carpetaFrontend, "index.html"));
});

app.listen(puerto, () => {
    console.log("Ajedrez Relampago escuchando en el puerto " + puerto);
});
