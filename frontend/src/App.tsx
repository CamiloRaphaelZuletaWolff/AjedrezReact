import { useState } from "react";
import Inicio from "./Inicio";
import Panel from "./Panel";
import Resultado from "./Resultado";
import Tablero from "./Tablero";
import {
    crearPartida,
    leerHistorial,
    leerPartida,
    moverPieza,
    type Partida,
    type PartidaTerminada
} from "./api";

// Componente principal. Guarda el estado que se ve en pantalla y decide
// que pantalla mostrar. Toda la logica del ajedrez esta en el backend:
// aqui solo se envian clics y se dibuja la respuesta.

function App() {
    const [partida, setPartida] = useState<Partida | null>(null);
    const [seleccion, setSeleccion] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [historial, setHistorial] = useState<PartidaTerminada[]>([]);

    async function empezar(blancas: string, negras: string) {
        setCargando(true);
        const respuesta = await crearPartida(blancas, negras);
        setCargando(false);

        if (!respuesta.ok) {
            setError(respuesta.error);
            return;
        }
        setError("");
        setSeleccion(null);
        setPartida(respuesta.datos);
    }

    // Cuando la partida termina se pide el historial al servidor.
    async function guardarResultado(nueva: Partida) {
        setPartida(nueva);
        if (nueva.estado === "terminada") {
            const respuesta = await leerHistorial();
            if (respuesta.ok) {
                setHistorial(respuesta.datos.historial);
            }
        }
    }

    async function clickCasilla(indice: number) {
        if (partida === null || partida.estado === "terminada") {
            return;
        }
        const pieza = partida.tablero[indice];

        // 1) Nada seleccionado todavia: hay que elegir una pieza propia.
        if (seleccion === null) {
            if (pieza === null) {
                setError("Esa casilla esta vacia");
                return;
            }
            if (pieza.color !== partida.turno) {
                setError("Esa pieza no es del jugador que tiene el turno");
                return;
            }
            setError("");
            setSeleccion(indice);
            return;
        }

        // 2) Clic sobre la misma pieza: se quita la seleccion.
        if (seleccion === indice) {
            setSeleccion(null);
            return;
        }

        // 3) Clic sobre otra pieza propia: se cambia la seleccion.
        if (pieza !== null && pieza.color === partida.turno) {
            setError("");
            setSeleccion(indice);
            return;
        }

        // 4) Cualquier otra casilla: el backend decide si la jugada es valida.
        const respuesta = await moverPieza(partida.id, seleccion, indice);
        setSeleccion(null);
        if (!respuesta.ok) {
            setError(respuesta.error);
            return;
        }
        setError("");
        await guardarResultado(respuesta.datos);
    }

    // Vuelve a pedir la partida al servidor (endpoint GET).
    async function actualizar() {
        if (partida === null) {
            return;
        }
        const respuesta = await leerPartida(partida.id);
        if (respuesta.ok) {
            setError("");
            setPartida(respuesta.datos);
        } else {
            setError(respuesta.error);
        }
    }

    function reiniciar() {
        setPartida(null);
        setSeleccion(null);
        setError("");
    }

    if (partida === null) {
        return (
            <div className="pantalla">
                <Inicio onEmpezar={empezar} cargando={cargando} />
                {error !== "" && (
                    <p className="error" data-cy="error">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    const destinos = seleccion === null ? [] : (partida.movimientosLegales[String(seleccion)] ?? []);
    const turnosRestantes = partida.turnosMaximos - partida.turnosJugados;

    return (
        <div className="pantalla juego">
            <header className="cabecera">
                <h1>Ajedrez Relampago</h1>
                <p data-cy="turno">
                    Turno de {partida.jugadores[partida.turno]} ({partida.turno})
                </p>
                <p data-cy="turnos-restantes">Turnos restantes: {turnosRestantes}</p>
                <button onClick={actualizar} data-cy="boton-actualizar">
                    Actualizar desde el servidor
                </button>
            </header>

            <main className="mesa">
                <Panel partida={partida} color="blancas" />

                <section className="centro">
                    <p className="mensaje" data-cy="mensaje">
                        {partida.mensaje}
                    </p>
                    <Tablero
                        tablero={partida.tablero}
                        seleccion={seleccion}
                        destinos={destinos}
                        onClickCasilla={clickCasilla}
                    />
                    <p className={error === "" ? "error oculto" : "error"} data-cy="error">
                        {error}
                    </p>
                </section>

                <Panel partida={partida} color="negras" />
            </main>

            <footer className="jugadas">
                <strong>Ultimas jugadas:</strong>
                <ul data-cy="jugadas">
                    {partida.jugadas.slice(0, 3).map((jugada, indice) => (
                        <li key={indice}>{jugada}</li>
                    ))}
                </ul>
            </footer>

            {partida.estado === "terminada" && (
                <div className="capa-resultado">
                    <Resultado partida={partida} historial={historial} onReiniciar={reiniciar} />
                </div>
            )}
        </div>
    );
}

export default App;
