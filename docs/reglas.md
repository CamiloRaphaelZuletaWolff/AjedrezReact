# Reglas de Ajedrez Relampago

## Inicio de la partida

- Los dos jugadores escriben su nombre. Si alguno queda vacio, el servidor responde
  `400` con `{"error": "Los dos jugadores necesitan un nombre"}` y la partida no se crea.
- El servidor crea el tablero en la posicion clasica del ajedrez.
- Cada jugador empieza con **6 de energia** y **0 puntos**.
- El servidor sortea **una mision** entre tres y se la asigna a la partida (es la misma
  para los dos; gana los puntos extra el primero que la cumple).
- Empiezan las **blancas**.

## Turnos

- Se juega por turnos alternos: blancas, negras, blancas...
- En cada turno el jugador mueve **una** pieza.
- Al empezar tu turno recuperas **+3 de energia**, con un tope de **10**.
- Mover cuesta energia segun la pieza:

  | Pieza | Coste |
  | --- | --- |
  | peon | 1 |
  | caballo | 2 |
  | alfil | 2 |
  | torre | 3 |
  | dama | 4 |
  | rey | 1 |

- Como el minimo coste es 1 y siempre recuperas 3, nunca te puedes quedar sin poder mover.

## Movimientos de las piezas

Se usan los movimientos clasicos del ajedrez:

- **Peon:** avanza 1 casilla si esta libre, 2 si es su primer movimiento y las dos casillas
  estan libres. Captura solo en diagonal hacia adelante.
- **Torre:** en linea recta (horizontal y vertical) hasta chocar con una pieza.
- **Alfil:** en diagonal hasta chocar con una pieza.
- **Dama:** recta y diagonal.
- **Caballo:** en L, saltando por encima de otras piezas.
- **Rey:** una casilla en cualquier direccion.
- **Coronacion:** el peon que llega a la ultima fila se convierte en dama.

### Simplificaciones respecto al ajedrez oficial

Son decisiones conscientes para que el proyecto sea explicable y comprobable:

- **No hay enroque.**
- **No hay captura al paso.**
- **No hay jaque ni jaque mate.** No se comprueba si un movimiento deja al rey en peligro.
- La partida se gana **capturando el rey**, no dando mate.

Estas reglas estan implementadas en `backend/src/juego.ts`, en la funcion
`movimientosDePieza`.

## Acciones invalidas

El servidor rechaza la jugada (responde `400` y un mensaje) cuando:

| Situacion | Mensaje |
| --- | --- |
| La partida ya termino | `La partida ya termino` |
| El indice no esta entre 0 y 63 | `Casilla fuera del tablero` |
| La casilla de origen esta vacia | `No hay ninguna pieza en esa casilla` |
| Se mueve una pieza del rival | `No es el turno de las blancas/negras` |
| El movimiento no es legal para esa pieza | `Un peon no puede moverse de a7 a h5` |
| No alcanza la energia | `Energia insuficiente: mover el dama cuesta 4 y tienes 3` |

Cuando una jugada se rechaza, **el turno no cambia** y no se gasta energia.
El mensaje se muestra en rojo debajo del tablero, sin abrir la consola.

## Puntos

- Capturar una pieza da puntos: peon 1, caballo 3, alfil 3, torre 5, dama 9, rey 100.
- Cumplir la mision da **+5 puntos**.

## Misiones (variabilidad)

El servidor sortea una de estas tres al crear la partida:

| Mision | Objetivo |
| --- | --- |
| `capturar_peones` | Captura 2 peones enemigos |
| `capturar_caballo` | Captura 1 caballo enemigo |
| `cruzar_peon` | Lleva 1 peon al lado rival del tablero |

Por eso dos partidas seguidas no se juegan igual: a veces conviene cazar peones y otras
veces conviene correr con un peon al otro lado.

## Condicion de victoria, empate y finalizacion

- **Victoria inmediata:** el jugador que **captura el rey** rival gana la partida.
- **Limite de tiempo:** la partida dura como maximo **60 turnos** (30 por jugador).
  Al llegar a ese limite gana quien tenga **mas puntos**.
- **Empate:** si al terminar los 60 turnos los dos tienen los mismos puntos.
- Al terminar, la partida se guarda en el historial del servidor y aparece la pantalla de
  resultado con el marcador final.

## Los cinco tipos de estado del juego

El juego relaciona bastante mas de tres tipos de estado:

1. **Posicion** de las 64 casillas del tablero.
2. **Energia** de cada jugador.
3. **Puntos** de cada jugador.
4. **Turno** actual y **numero de turnos jugados** (limite de 60).
5. **Mision** sorteada, con su **progreso** por jugador.
6. **Estado de la partida** (`en_curso` / `terminada`) y el **ganador**.

## Elementos que se mueven

- Las **piezas** cambian de casilla en cada jugada y desaparecen del tablero cuando son
  capturadas.
- Un **peon que corona desaparece y aparece como dama** en la misma casilla.
- Las **barras de energia** de los dos paneles suben y bajan en cada turno.
- El resaltado de casillas legales aparece y desaparece segun la pieza seleccionada.

## Interaccion entre jugadores

Los dos jugadores comparten un unico tablero guardado en el servidor. Cada jugada de uno
modifica directamente lo que el otro puede hacer: le quita piezas, le bloquea casillas y le
compite por cumplir primero la mision. No son dos juegos en paralelo.

## Decision estrategica

En cada turno hay que elegir entre alternativas con consecuencias distintas:

- gastar 4 de energia moviendo la dama y quedarse casi sin recursos el turno siguiente, o
- gastar 1 con un peon y guardar energia para una captura grande despues,
- perseguir la mision (5 puntos) o capturar una pieza valiosa (hasta 9 puntos),
- avanzar rapido y arriesgar el rey, o defender y esperar a ganar por puntos en el turno 60.

No sirve apretar siempre el mismo boton: repetir el mismo movimiento agota la energia y
regala turnos al rival.
