import type { Pieza } from "./api";

// Dibuja las 64 casillas. No decide nada del juego: solo muestra lo que llega
// del backend y avisa a App cuando el usuario hace clic en una casilla.

type Props = {
    tablero: (Pieza | null)[];
    seleccion: number | null;
    destinos: number[];
    onClickCasilla: (indice: number) => void;
};

function Tablero({ tablero, seleccion, destinos, onClickCasilla }: Props) {
    return (
        <div className="tablero" data-cy="tablero">
            {tablero.map((pieza, indice) => {
                const fila = Math.floor(indice / 8);
                const columna = indice % 8;
                const clara = (fila + columna) % 2 === 0;

                const clases = ["casilla", clara ? "clara" : "oscura"];
                if (indice === seleccion) {
                    clases.push("seleccionada");
                }
                if (destinos.includes(indice)) {
                    clases.push(pieza === null ? "destino" : "destino-captura");
                }

                return (
                    <button
                        key={indice}
                        className={clases.join(" ")}
                        data-cy={"casilla-" + indice}
                        onClick={() => onClickCasilla(indice)}
                    >
                        {pieza !== null && (
                            <img
                                className="pieza"
                                src={"/piezas/" + pieza.color + "-" + pieza.tipo + ".png"}
                                alt={pieza.tipo + " " + pieza.color}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default Tablero;
