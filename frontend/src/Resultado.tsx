import type { Partida, PartidaTerminada } from "./api";

// Seccion de resultado. Aparece encima del tablero cuando la partida termina.
// El historial viene del backend (GET /api/historial).

type Props = {
    partida: Partida;
    historial: PartidaTerminada[];
    onReiniciar: () => void;
};

function Resultado({ partida, historial, onReiniciar }: Props) {
    const titulo =
        partida.ganador === "blancas" || partida.ganador === "negras"
            ? "Gana " + partida.jugadores[partida.ganador]
            : "Empate";

    return (
        <div className="resultado" data-cy="resultado">
            <h2 data-cy="resultado-titulo">{titulo}</h2>
            <p>{partida.mensaje}</p>
            <p className="marcador-final">
                {partida.jugadores.blancas} {partida.puntos.blancas} - {partida.puntos.negras}{" "}
                {partida.jugadores.negras}
            </p>

            <h3>Ultimas partidas del servidor</h3>
            <ul className="historial" data-cy="historial">
                {historial.map((fila) => (
                    <li key={fila.id}>
                        {fila.jugadores.blancas} vs {fila.jugadores.negras} - ganador: {fila.ganador} (
                        {fila.turnos} turnos)
                    </li>
                ))}
            </ul>

            <button className="boton-principal" onClick={onReiniciar} data-cy="boton-reiniciar">
                Jugar otra vez
            </button>
        </div>
    );
}

export default Resultado;
