// -----------------------------------------------------------------------------
// api.ts  -  Unico lugar del frontend que habla con el backend.
// Se usa la API nativa fetch (sin librerias) y todo viaja como JSON.
// Las rutas son relativas ("/api/..."), por eso funciona igual en desarrollo
// (con el proxy de Vite) y en produccion (Express sirve frontend y API juntos).
// -----------------------------------------------------------------------------

export type Color = "blancas" | "negras";
export type TipoPieza = "peon" | "caballo" | "alfil" | "torre" | "dama" | "rey";

export type Pieza = {
    tipo: TipoPieza;
    color: Color;
};

export type Partida = {
    id: string;
    jugadores: Record<Color, string>;
    tablero: (Pieza | null)[];
    turno: Color;
    energia: Record<Color, number>;
    puntos: Record<Color, number>;
    mision: { tipo: string; descripcion: string; objetivo: number };
    progresoMision: Record<Color, number>;
    misionCumplida: Record<Color, boolean>;
    turnosJugados: number;
    turnosMaximos: number;
    estado: "en_curso" | "terminada";
    ganador: Color | "empate" | null;
    mensaje: string;
    jugadas: string[];
    costeEnergia: Record<TipoPieza, number>;
    movimientosLegales: Record<string, number[]>;
};

export type PartidaTerminada = {
    id: string;
    jugadores: Record<string, string>;
    ganador: string | null;
    puntos: Record<string, number>;
    turnos: number;
};

// Resultado de cualquier llamada: o llegaron datos, o llego un mensaje de error.
export type Resultado<T> =
    | { ok: true; datos: T }
    | { ok: false; error: string };

async function pedir<T>(url: string, opciones?: RequestInit): Promise<Resultado<T>> {
    try {
        const respuesta = await fetch(url, opciones);
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            return { ok: false, error: datos.error ?? "Error del servidor" };
        }
        return { ok: true, datos };
    } catch {
        return { ok: false, error: "No se pudo conectar con el servidor" };
    }
}

export function crearPartida(blancas: string, negras: string): Promise<Resultado<Partida>> {
    return pedir<Partida>("/api/partidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blancas, negras })
    });
}

export function moverPieza(id: string, desde: number, hasta: number): Promise<Resultado<Partida>> {
    return pedir<Partida>("/api/partidas/" + id + "/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desde, hasta })
    });
}

export function leerPartida(id: string): Promise<Resultado<Partida>> {
    return pedir<Partida>("/api/partidas/" + id);
}

export function leerHistorial(): Promise<Resultado<{ historial: PartidaTerminada[] }>> {
    return pedir<{ historial: PartidaTerminada[] }>("/api/historial");
}
