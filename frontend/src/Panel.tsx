import type { Color, Partida } from "./api";

// Tarjeta lateral de un jugador: energia, puntos y progreso de la mision.
// El borde se ilumina cuando es su turno.

type Props = {
    partida: Partida;
    color: Color;
};

function Panel({ partida, color }: Props) {
    const enTurno = partida.turno === color && partida.estado === "en_curso";
    const energia = partida.energia[color];

    return (
        <aside className={enTurno ? "panel panel-activo" : "panel"} data-cy={"panel-" + color}>
            <h2>{partida.jugadores[color]}</h2>
            <p className="etiqueta-color">Piezas {color}</p>

            {enTurno && <p className="aviso-turno" data-cy="aviso-turno">Es tu turno</p>}

            <div className="dato">
                <span>Energia</span>
                <strong data-cy={"energia-" + color}>{energia} / 10</strong>
            </div>
            <div className="barra">
                <div className="barra-llena" style={{ width: energia * 10 + "%" }} />
            </div>

            <div className="dato">
                <span>Puntos</span>
                <strong data-cy={"puntos-" + color}>{partida.puntos[color]}</strong>
            </div>

            <div className="dato">
                <span>Mision</span>
                <strong>
                    {partida.progresoMision[color]} / {partida.mision.objetivo}
                </strong>
            </div>
            <p className="mision">
                {partida.mision.descripcion}
                {partida.misionCumplida[color] && " (cumplida: +5 puntos)"}
            </p>

            <h3>Coste de mover</h3>
            <ul className="costes">
                {Object.entries(partida.costeEnergia).map(([tipo, coste]) => (
                    <li key={tipo}>
                        <span>{tipo}</span>
                        <span>{coste}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

export default Panel;
