# Introduccion al proyecto

## Nombre del juego

**Ajedrez Relampago**

## Que es

Es un ajedrez por turnos para dos personas con dos anadidos propios que cambian la forma
de jugar:

1. **Energia.** Mover cada pieza cuesta energia (peon 1, caballo 2, alfil 2, torre 3,
   dama 4, rey 1). Al empezar tu turno recuperas 3 puntos de energia, hasta un maximo de 10.
   No se puede mover la dama en todos los turnos: hay que administrar el recurso.
2. **Mision aleatoria.** Al crear la partida el servidor sortea una mision entre tres
   posibles. El primero que la cumple gana 5 puntos extra. Por eso ninguna partida empieza
   con el mismo objetivo secundario.

## Proposito

El proyecto sirve para demostrar el flujo completo de una aplicacion web:

- el usuario hace clic en el tablero,
- React envia la accion al backend con `fetch`,
- Express valida la jugada, cambia el estado de la partida y responde con JSON,
- React vuelve a dibujar la pantalla con lo que devolvio el servidor.

La logica del ajedrez **no esta en el navegador**. El frontend no sabe si un movimiento es
legal: siempre se lo pregunta al servidor.

## Experiencia de juego que propone

La partida es rapida y obliga a decidir. El ajedrez normal premia pensar muchas jugadas
adelante; aqui ademas hay que decidir *cuanto gastar ahora*. Mover la dama dos turnos
seguidos deja sin energia, y a veces conviene adelantar peones baratos para cumplir la
mision antes que el rival.

## Cantidad y tipo de jugadores

- **Dos jugadores humanos**, por turnos, en el **mismo dispositivo** (hot seat).
- Cada jugador escribe su nombre en la pantalla de inicio. Uno juega con las blancas y el
  otro con las negras.
- No hay jugador controlado por la computadora: los dos jugadores son personas y compiten
  sobre el mismo tablero compartido que guarda el servidor.

## Que ve y que hace el usuario

1. **Pantalla de inicio.** Ve el titulo, las instrucciones completas (turnos, costes de
   energia, condicion de victoria) y un formulario con dos campos de nombre.
   Si deja un nombre vacio, el servidor responde con un error y se ve en rojo.
2. **Partida.** Ve el tablero de 8x8 en el centro con las piezas dibujadas como imagenes,
   el panel del jugador de blancas a la izquierda y el de negras a la derecha. Cada panel
   muestra energia (con barra), puntos, progreso de la mision y la tabla de costes.
   Arriba se ve de quien es el turno y cuantos turnos quedan; abajo, las ultimas jugadas.
3. **Decisiones que toma.** Elige que pieza mover y a donde, sabiendo que cada pieza gasta
   una cantidad distinta de energia y que capturar da puntos.
4. **Como responde el sistema.** Al hacer clic en una pieza propia se resaltan en verde las
   casillas libres a las que puede ir y en rojo las capturas posibles (esa lista la calcula
   el servidor). Al hacer clic en el destino, el frontend envia la jugada; si el servidor la
   rechaza aparece un mensaje de error y el turno no cambia.
5. **Como termina.** Cuando alguien captura el rey rival, o cuando se agotan los 60 turnos.
   Aparece una capa con el resultado, el marcador final y el historial de las ultimas
   partidas que guardo el servidor, con un boton para jugar otra vez.

## Por que no es un juego de clase

En clase se hicieron tres en raya, buscaminas, carrera de emojis, juego de memoria,
serpiente y Space Invaders. Este proyecto no reutiliza ninguno de esos tableros, reglas
ni codigo: parte de un juego distinto (ajedrez) y encima agrega un sistema de energia y de
misiones que no existe en ninguno de ellos.
