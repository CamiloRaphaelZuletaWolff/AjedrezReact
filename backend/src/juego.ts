// -----------------------------------------------------------------------------
// juego.ts  -  Toda la logica de "Ajedrez Relampago".
// Este archivo no sabe nada de Express: solo crea partidas y aplica jugadas.
// El servidor (server.ts) es el unico que lo usa.
// -----------------------------------------------------------------------------

export type Color = "blancas" | "negras";
export type TipoPieza = "peon" | "caballo" | "alfil" | "torre" | "dama" | "rey";

export type Pieza = {
    tipo: TipoPieza;
    color: Color;
};

// El tablero es un arreglo plano de 64 casillas (null = casilla vacia).
// indice 0  = a8 (arriba a la izquierda)
// indice 63 = h1 (abajo a la derecha)
// fila    = Math.floor(indice / 8)   ->  0 es arriba (negras), 7 es abajo (blancas)
// columna = indice % 8               ->  0 es la columna "a"
export type Tablero = (Pieza | null)[];

export type Mision = {
    tipo: "capturar_peones" | "capturar_caballo" | "cruzar_peon";
    descripcion: string;
    objetivo: number;
};

export type Partida = {
    id: string;
    jugadores: Record<Color, string>;
    tablero: Tablero;
    turno: Color;
    energia: Record<Color, number>;
    puntos: Record<Color, number>;
    mision: Mision;
    progresoMision: Record<Color, number>;
    misionCumplida: Record<Color, boolean>;
    turnosJugados: number;
    estado: "en_curso" | "terminada";
    ganador: Color | "empate" | null;
    mensaje: string;
    jugadas: string[];
};

// --- Constantes de la variante -----------------------------------------------

// Mover cada pieza cuesta energia. Aqui esta la decision estrategica del juego:
// mover la dama es potente pero cuesta 4, mover un peon solo cuesta 1.
export const COSTE_ENERGIA: Record<TipoPieza, number> = {
    peon: 1,
    caballo: 2,
    alfil: 2,
    torre: 3,
    dama: 4,
    rey: 1
};

// Puntos que gana el jugador al capturar cada pieza.
export const VALOR_PIEZA: Record<TipoPieza, number> = {
    peon: 1,
    caballo: 3,
    alfil: 3,
    torre: 5,
    dama: 9,
    rey: 100
};

export const ENERGIA_INICIAL = 6;
export const ENERGIA_POR_TURNO = 3;
export const ENERGIA_MAXIMA = 10;
export const TURNOS_MAXIMOS = 60;
export const PUNTOS_MISION = 5;

// Las misiones dan variabilidad: el servidor sortea una distinta en cada partida.
const MISIONES: Mision[] = [
    { tipo: "capturar_peones", descripcion: "Captura 2 peones enemigos", objetivo: 2 },
    { tipo: "capturar_caballo", descripcion: "Captura 1 caballo enemigo", objetivo: 1 },
    { tipo: "cruzar_peon", descripcion: "Lleva 1 peon al lado rival del tablero", objetivo: 1 }
];

// Orden de las piezas en la primera fila de cada bando.
const ORDEN_PRIMERA_FILA: TipoPieza[] = [
    "torre", "caballo", "alfil", "dama", "rey", "alfil", "caballo", "torre"
];

// --- Creacion de la partida ---------------------------------------------------

function crearTablero(): Tablero {
    const tablero: Tablero = new Array(64).fill(null);
    for (let columna = 0; columna < 8; columna++) {
        tablero[columna] = { tipo: ORDEN_PRIMERA_FILA[columna], color: "negras" };        // fila 0
        tablero[8 + columna] = { tipo: "peon", color: "negras" };                         // fila 1
        tablero[48 + columna] = { tipo: "peon", color: "blancas" };                       // fila 6
        tablero[56 + columna] = { tipo: ORDEN_PRIMERA_FILA[columna], color: "blancas" };  // fila 7
    }
    return tablero;
}

export function crearPartida(id: string, blancas: string, negras: string): Partida {
    const mision = MISIONES[Math.floor(Math.random() * MISIONES.length)];
    return {
        id,
        jugadores: { blancas, negras },
        tablero: crearTablero(),
        turno: "blancas",
        energia: { blancas: ENERGIA_INICIAL, negras: ENERGIA_INICIAL },
        puntos: { blancas: 0, negras: 0 },
        mision,
        progresoMision: { blancas: 0, negras: 0 },
        misionCumplida: { blancas: false, negras: false },
        turnosJugados: 0,
        estado: "en_curso",
        ganador: null,
        mensaje: "Comienzan las blancas. Mision de la partida: " + mision.descripcion,
        jugadas: []
    };
}

// --- Movimientos --------------------------------------------------------------

function dentroDelTablero(fila: number, columna: number): boolean {
    return fila >= 0 && fila < 8 && columna >= 0 && columna < 8;
}

const RECTAS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONALES = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const SALTOS_CABALLO = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];

// Devuelve todas las casillas a las que puede ir la pieza que esta en "desde".
// Esta version del ajedrez NO tiene enroque, captura al paso ni jaque:
// son simplificaciones documentadas en docs/reglas.md.
export function movimientosDePieza(tablero: Tablero, desde: number): number[] {
    const pieza = tablero[desde];
    if (pieza === null) {
        return [];
    }

    const fila = Math.floor(desde / 8);
    const columna = desde % 8;
    const colorPieza = pieza.color;
    const destinos: number[] = [];

    // Intenta agregar una casilla. Devuelve true si el camino sigue libre
    // (lo usan las piezas que se deslizan: torre, alfil y dama).
    function agregar(f: number, c: number): boolean {
        if (!dentroDelTablero(f, c)) {
            return false;
        }
        const ocupante = tablero[f * 8 + c];
        if (ocupante === null) {
            destinos.push(f * 8 + c);
            return true;
        }
        if (ocupante.color !== colorPieza) {
            destinos.push(f * 8 + c);
        }
        return false;
    }

    function deslizar(direcciones: number[][]): void {
        for (const direccion of direcciones) {
            let f = fila + direccion[0];
            let c = columna + direccion[1];
            while (agregar(f, c)) {
                f += direccion[0];
                c += direccion[1];
            }
        }
    }

    if (pieza.tipo === "peon") {
        // Las blancas suben (fila menor) y las negras bajan (fila mayor).
        const avance = pieza.color === "blancas" ? -1 : 1;
        const filaInicial = pieza.color === "blancas" ? 6 : 1;
        const unPaso = fila + avance;

        if (dentroDelTablero(unPaso, columna) && tablero[unPaso * 8 + columna] === null) {
            destinos.push(unPaso * 8 + columna);
            const dosPasos = fila + avance * 2;
            if (fila === filaInicial && tablero[dosPasos * 8 + columna] === null) {
                destinos.push(dosPasos * 8 + columna);
            }
        }
        // El peon solo captura en diagonal.
        for (const dc of [-1, 1]) {
            const c = columna + dc;
            if (dentroDelTablero(unPaso, c)) {
                const ocupante = tablero[unPaso * 8 + c];
                if (ocupante !== null && ocupante.color !== pieza.color) {
                    destinos.push(unPaso * 8 + c);
                }
            }
        }
    } else if (pieza.tipo === "caballo") {
        for (const salto of SALTOS_CABALLO) {
            agregar(fila + salto[0], columna + salto[1]);
        }
    } else if (pieza.tipo === "rey") {
        for (const direccion of [...RECTAS, ...DIAGONALES]) {
            agregar(fila + direccion[0], columna + direccion[1]);
        }
    } else if (pieza.tipo === "torre") {
        deslizar(RECTAS);
    } else if (pieza.tipo === "alfil") {
        deslizar(DIAGONALES);
    } else {
        deslizar([...RECTAS, ...DIAGONALES]);
    }

    return destinos;
}

// Mapa { casillaOrigen: [casillasDestino] } de todas las piezas del jugador que
// tiene el turno. El frontend lo usa para pintar las casillas resaltadas.
export function movimientosLegales(partida: Partida): Record<number, number[]> {
    const legales: Record<number, number[]> = {};
    if (partida.estado === "terminada") {
        return legales;
    }
    for (let casilla = 0; casilla < 64; casilla++) {
        const pieza = partida.tablero[casilla];
        if (pieza !== null && pieza.color === partida.turno) {
            const destinos = movimientosDePieza(partida.tablero, casilla);
            if (destinos.length > 0) {
                legales[casilla] = destinos;
            }
        }
    }
    return legales;
}

// Convierte el indice 0..63 al nombre clasico de la casilla ("e2", "a8", ...).
export function nombreCasilla(indice: number): string {
    return "abcdefgh"[indice % 8] + String(8 - Math.floor(indice / 8));
}

// --- Aplicar una jugada -------------------------------------------------------

function otroColor(color: Color): Color {
    return color === "blancas" ? "negras" : "blancas";
}

function revisarMision(
    partida: Partida,
    color: Color,
    pieza: Pieza,
    capturada: Pieza | null,
    filaDestino: number
): void {
    if (partida.misionCumplida[color]) {
        return;
    }
    const mision = partida.mision;

    if (mision.tipo === "capturar_peones" && capturada !== null && capturada.tipo === "peon") {
        partida.progresoMision[color] += 1;
    }
    if (mision.tipo === "capturar_caballo" && capturada !== null && capturada.tipo === "caballo") {
        partida.progresoMision[color] += 1;
    }
    if (mision.tipo === "cruzar_peon" && pieza.tipo === "peon") {
        // "Lado rival": las blancas llegan a la fila 3 o menor, las negras a la 4 o mayor.
        const cruzo = color === "blancas" ? filaDestino <= 3 : filaDestino >= 4;
        if (cruzo) {
            partida.progresoMision[color] = mision.objetivo;
        }
    }

    if (partida.progresoMision[color] >= mision.objetivo) {
        partida.misionCumplida[color] = true;
        partida.puntos[color] += PUNTOS_MISION;
    }
}

function terminarPorTurnos(partida: Partida): void {
    partida.estado = "terminada";
    if (partida.puntos.blancas > partida.puntos.negras) {
        partida.ganador = "blancas";
        partida.mensaje = "Se acabaron los turnos. Gana " + partida.jugadores.blancas + " por puntos.";
    } else if (partida.puntos.negras > partida.puntos.blancas) {
        partida.ganador = "negras";
        partida.mensaje = "Se acabaron los turnos. Gana " + partida.jugadores.negras + " por puntos.";
    } else {
        partida.ganador = "empate";
        partida.mensaje = "Se acabaron los turnos con los mismos puntos: empate.";
    }
}

// Aplica un movimiento sobre la partida.
// Devuelve null si todo salio bien, o un texto de error si la jugada no es valida.
export function aplicarMovimiento(partida: Partida, desde: number, hasta: number): string | null {
    if (partida.estado === "terminada") {
        return "La partida ya termino";
    }
    if (!Number.isInteger(desde) || !Number.isInteger(hasta) ||
        desde < 0 || desde > 63 || hasta < 0 || hasta > 63) {
        return "Casilla fuera del tablero";
    }

    const pieza = partida.tablero[desde];
    if (pieza === null) {
        return "No hay ninguna pieza en esa casilla";
    }
    if (pieza.color !== partida.turno) {
        return "No es el turno de las " + pieza.color;
    }
    if (!movimientosDePieza(partida.tablero, desde).includes(hasta)) {
        return "Un " + pieza.tipo + " no puede moverse de " + nombreCasilla(desde) + " a " + nombreCasilla(hasta);
    }

    const coste = COSTE_ENERGIA[pieza.tipo];
    if (partida.energia[partida.turno] < coste) {
        return "Energia insuficiente: mover el " + pieza.tipo + " cuesta " + coste +
            " y tienes " + partida.energia[partida.turno];
    }

    // A partir de aqui la jugada es valida y se modifica el estado de la partida.
    const jugador = partida.turno;
    const capturada = partida.tablero[hasta];

    partida.tablero[hasta] = pieza;
    partida.tablero[desde] = null;
    partida.energia[jugador] -= coste;
    partida.turnosJugados += 1;

    if (capturada !== null) {
        partida.puntos[jugador] += VALOR_PIEZA[capturada.tipo];
    }

    // Coronacion: el peon que llega al fondo se convierte en dama.
    const filaDestino = Math.floor(hasta / 8);
    if (pieza.tipo === "peon" && (filaDestino === 0 || filaDestino === 7)) {
        partida.tablero[hasta] = { tipo: "dama", color: pieza.color };
    }

    revisarMision(partida, jugador, pieza, capturada, filaDestino);

    const textoCaptura = capturada === null ? "" : " y captura " + capturada.tipo;
    partida.jugadas.unshift(
        partida.jugadores[jugador] + " mueve " + pieza.tipo + " " +
        nombreCasilla(desde) + " a " + nombreCasilla(hasta) + textoCaptura
    );

    if (capturada !== null && capturada.tipo === "rey") {
        partida.estado = "terminada";
        partida.ganador = jugador;
        partida.mensaje = partida.jugadores[jugador] + " captura el rey y gana la partida.";
        return null;
    }

    if (partida.turnosJugados >= TURNOS_MAXIMOS) {
        terminarPorTurnos(partida);
        return null;
    }

    // Cambia el turno y el nuevo jugador recupera energia.
    partida.turno = otroColor(jugador);
    partida.energia[partida.turno] = Math.min(
        ENERGIA_MAXIMA,
        partida.energia[partida.turno] + ENERGIA_POR_TURNO
    );
    partida.mensaje = "Turno de " + partida.jugadores[partida.turno] + " (" + partida.turno + ").";
    return null;
}

// Lo que se envia al frontend: la partida mas los movimientos que puede hacer
// el jugador que tiene el turno y la tabla de costes de energia.
export function vistaPartida(partida: Partida) {
    return {
        ...partida,
        turnosMaximos: TURNOS_MAXIMOS,
        costeEnergia: COSTE_ENERGIA,
        movimientosLegales: movimientosLegales(partida)
    };
}
