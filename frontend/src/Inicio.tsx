import { useState } from "react";

// Pantalla de inicio: pide los nombres de los dos jugadores y explica las reglas.
// Si algun nombre esta vacio, el backend responde 400 y App muestra el error.

type Props = {
    onEmpezar: (blancas: string, negras: string) => void;
    cargando: boolean;
};

function Inicio({ onEmpezar, cargando }: Props) {
    const [blancas, setBlancas] = useState("");
    const [negras, setNegras] = useState("");

    return (
        <div className="inicio">
            <h1>Ajedrez Blitz 2</h1>
            <p className="subtitulo">Ajedrez para dos jugadores en el mismo teclado, con energia y misiones.</p>

            <div className="inicio-columnas">
                <section className="tarjeta">
                    <h2>Como se juega</h2>
                    <ul>
                        <li>Dos jugadores por turnos: blancas empiezan.</li>
                        <li>Haz clic en una pieza tuya y luego en la casilla de destino.</li>
                        <li>Cada movimiento gasta energia: peon 1, caballo 2, alfil 2, torre 3, dama 4, rey 1.</li>
                        <li>Al empezar tu turno recuperas 3 de energia (maximo 10).</li>
                        <li>Capturar piezas da puntos. El servidor sortea una mision por partida.</li>
                        <li>Gana quien captura el rey rival. A los 60 turnos gana el de mas puntos.</li>
                    </ul>
                </section>

                <section className="tarjeta">
                    <h2>Jugadores</h2>
                    <label htmlFor="blancas">Jugador de blancas</label>
                    <input
                        id="blancas"
                        value={blancas}
                        onChange={(evento) => setBlancas(evento.target.value)}
                        placeholder="Nombre"
                    />

                    <label htmlFor="negras">Jugador de negras</label>
                    <input
                        id="negras"
                        value={negras}
                        onChange={(evento) => setNegras(evento.target.value)}
                        placeholder="Nombre"
                    />

                    <button
                        className="boton-principal"
                        onClick={() => onEmpezar(blancas, negras)}
                        disabled={cargando}
                    >
                        {cargando ? "Creando partida..." : "Empezar partida"}
                    </button>
                </section>
            </div>
        </div>
    );
}

export default Inicio;
