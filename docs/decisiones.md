# Decisiones de diseno y tecnicas

## Boceto de la pantalla

La pantalla de juego ocupa todo el navegador. No es un formulario centrado: el tablero va
al medio y los dos jugadores tienen su panel a los costados.

```
+--------------------------------------------------------------------------+
| Ajedrez Relampago   Turno de Ana (blancas)   Turnos restantes: 59   [Act.]|
+--------------------------------------------------------------------------+
|                |                                      |                  |
|  ANA           |        Turno de Ana (blancas)        |   BETO           |
|  piezas blancas|                                      |   piezas negras  |
|  [ES TU TURNO] |   +------------------------------+   |                  |
|                |   | T C A D R A C T  <- negras   |   |  Energia  6 / 10 |
|  Energia 6/10  |   | P P P P P P P P              |   |  [======    ]    |
|  [======    ]  |   |                              |   |                  |
|                |   |                              |   |  Puntos   0      |
|  Puntos   0    |   |         (8 x 8)              |   |                  |
|                |   |                              |   |  Mision   0 / 1  |
|  Mision   0/1  |   | P P P P P P P P              |   |  Lleva 1 peon... |
|  Lleva 1 peon..|   | T C A D R A C T  <- blancas  |   |                  |
|                |   +------------------------------+   |  Coste de mover  |
|  Coste de mover|                                      |   peon      1    |
|   peon      1  |     (mensaje de error en rojo)       |   caballo   2    |
|   caballo   2  |                                      |   ...            |
|   ...          |                                      |                  |
+--------------------------------------------------------------------------+
| Ultimas jugadas: Ana mueve peon e2 a e4                                   |
+--------------------------------------------------------------------------+
```

Cuando la partida termina aparece encima una capa oscura con el resultado, el marcador
final, el historial del servidor y el boton "Jugar otra vez".

## Pantalla de inicio

```
+--------------------------------------------------------------------------+
|                        Ajedrez Relampago                                  |
|        Ajedrez para dos jugadores en el mismo teclado, con energia        |
|                                                                           |
|   +---------------------------+   +---------------------------+          |
|   | Como se juega             |   | Jugadores                 |          |
|   | - Dos jugadores por turnos|   | Jugador de blancas        |          |
|   | - Clic en pieza y destino |   | [________________]        |          |
|   | - Cada pieza cuesta ...   |   | Jugador de negras         |          |
|   | - Gana quien captura rey  |   | [________________]        |          |
|   +---------------------------+   | [  Empezar partida  ]     |          |
|                                   +---------------------------+          |
+--------------------------------------------------------------------------+
```

---

## Responsabilidades de React y de Express

### React (frontend)

React **no conoce las reglas del ajedrez**. Solo:

- dibuja el escenario: tablero de 64 casillas, piezas como imagenes, paneles y marcador;
- recibe las interacciones: clic en una casilla, escritura de nombres, botones;
- guarda el estado *de la pantalla*: que casilla esta seleccionada, que mensaje de error
  mostrar, si esta cargando;
- envia las acciones al backend con `fetch` y vuelve a renderizar con la respuesta.

Archivos: `App.tsx` (estado y decisiones de pantalla), `Inicio.tsx`, `Tablero.tsx`,
`Panel.tsx`, `Resultado.tsx` y `api.ts` (el unico que habla HTTP).

### Express (backend)

Express asume las responsabilidades importantes de la partida:

1. **Crear la partida y generar el estado inicial**, incluido el sorteo de la mision.
2. **Validar cada movimiento**: turno correcto, pieza existente, movimiento legal para esa
   pieza, energia suficiente, partida no terminada.
3. **Procesar el turno**: aplicar la captura, cobrar la energia, regenerar la del rival,
   sumar puntos, coronar peones, revisar la mision.
4. **Calcular el resultado**: victoria por captura del rey, victoria por puntos al turno 60
   o empate.
5. **Guardar el estado** de todas las partidas y **entregar el historial** de las terminadas.

Archivos: `server.ts` (rutas HTTP) y `juego.ts` (reglas).

### Por que la logica esta toda en el servidor

Si el navegador calculara las jugadas legales, cualquiera podria abrir las herramientas de
desarrollo y hacer trampa. Ademas, el enunciado pide que el backend participe en una
decision significativa: aqui participa en **todas**.

El servidor si envia al frontend la lista `movimientosLegales`, pero solo para pintar las
casillas resaltadas. Cuando el jugador hace clic, la jugada vuelve a validarse en el
servidor; el frontend nunca da una jugada por buena.

---

## Decisiones tecnicas y su justificacion

| Decision | Por que |
| --- | --- |
| **Dos `package.json` separados** (`backend/` y `frontend/`) | Son dos proyectos con dependencias distintas: el backend no necesita React y el frontend no necesita Express. Es mas facil de explicar y los workflows pueden instalar solo lo que usan. |
| **Express sirve `frontend/dist`** | El enunciado pide un solo dominio y puerto. Ademas evita configurar CORS y hace que el despliegue en Render sea un solo servicio. |
| **Proxy de Vite en desarrollo** | En desarrollo hacen falta dos procesos (Vite en 5173, Express en 3000). El proxy hace que el codigo del frontend use siempre rutas relativas `/api/...`, exactamente iguales en local y en produccion. Asi no hay variables de entorno con URLs. |
| **Estado en memoria (`Map`)** | El proyecto no pide base de datos. Un `Map` en el servidor alcanza para guardar partidas y el historial, y mantiene el codigo entendible. La contra esta en la seccion de riesgos. |
| **Tablero como arreglo plano de 64** | Es mas simple de enviar por JSON y de recorrer que una matriz de 8x8, y los calculos de fila/columna son dos operaciones. |
| **Sin jaque ni jaque mate** | Detectar jaque, mate y clavadas multiplicaria el tamano del codigo. Se gana capturando el rey, que es una regla clara y facil de probar. Es una variante, no un error. |
| **El backend devuelve `movimientosLegales`** | El frontend puede resaltar las casillas sin duplicar las reglas del ajedrez. Una sola fuente de verdad. |
| **React Compiler activado** | Viene con `@vitejs/plugin-react` (`compiler: true`). Optimiza los componentes al compilar sin tener que escribir `useMemo` ni `useCallback` a mano. |
| **Sin librerias de UI, estado ni HTTP** | Lo prohibe el enunciado y tampoco hacen falta: la interfaz es CSS propio con Grid y Flexbox, el estado son `useState` y las peticiones son `fetch`. |
| **Estilo pixel art hecho solo con CSS** | El juego usa piezas pixeladas, asi que toda la interfaz sigue la misma estetica: `border-radius: 0` en todo, bordes de 3-4 px, sombras duras (`box-shadow: 4px 4px 0` sin desenfoque), botones que se hunden al apretarlos, barra de energia dibujada como bloques con `repeating-linear-gradient` y un fondo con rejilla de 8x8 px. No hace falta ninguna libreria: esta todo en `frontend/src/estilos.css`. |
| **Fuente "Press Start 2P" desde Google Fonts** | Es una **hoja de estilos con una fuente**, no una libreria de componentes ni de logica, asi que no entra en lo que prohibe el enunciado. Se carga con dos etiquetas `<link>` en `index.html`. Si no hay internet, la declaracion `--fuente: "Press Start 2P", "Courier New", monospace` cae en la monoespaciada del sistema y el resto del estilo retro se mantiene igual. Para quitarla basta borrar esas dos lineas del HTML. |
| **Cypress para E2E** | Ver `investigacion.md`. |
| **Render para publicar** | Ver `investigacion.md`. |

---

## Imagenes de las piezas

Las piezas se dibujan con `<img src="/piezas/{color}-{tipo}.png">`, con los archivos en
`frontend/public/piezas/`. Se eligio asi (y no SVG ni emojis) porque:

- el enunciado pide usar imagenes, pixeladas o normales;
- cambiar el diseno es solo reemplazar los archivos, sin tocar codigo.

Las imagenes actuales son **placeholders pixel art** generados para el proyecto.
Requisitos para reemplazarlas:

- **Nombres exactos** (12 archivos): `blancas-peon.png`, `blancas-torre.png`,
  `blancas-caballo.png`, `blancas-alfil.png`, `blancas-dama.png`, `blancas-rey.png`,
  y los mismos seis con `negras-`.
- **Formato PNG con fondo transparente.** Sin fondo propio: debajo se ve la casilla.
- **Cuadradas**, 64x64 px (o 32x32 / 128x128; el CSS las escala al 84% de la casilla).
- **Pixel art**: el CSS usa `image-rendering: pixelated`, asi que se ven nitidas al
  agrandarse. Si se usan imagenes normales (no pixeladas), conviene quitar esa linea
  de `.pieza` en `frontend/src/estilos.css`.
- **Contraste**: las piezas blancas deben verse sobre la casilla clara (`#e9dcc3`) y las
  negras sobre la oscura (`#7a6448`). Lo mas seguro es ponerles un borde de color contrario.
- Dejar un margen de 1-2 px alrededor para que la pieza no toque el borde de la casilla.

---

## Riesgos tecnicos y como se reducen

| Riesgo | Estrategia |
| --- | --- |
| **El estado en memoria se pierde si el servidor se reinicia.** En el plan gratuito de Render el servicio se duerme por inactividad. | Se asume: una partida dura pocos minutos y es hot seat. Para la defensa, se crea la partida en el momento. Si hiciera falta persistir, bastaria cambiar el `Map` por un archivo JSON o una base de datos sin tocar el resto. |
| **El primer acceso a Render tarda** (el servicio dormido tarda ~50 s en despertar). | Abrir la URL publica unos minutos antes de la defensa para que el servicio este despierto. |
| **Las pruebas E2E fallan por tiempos** (el servidor todavia no responde). | El workflow espera con un bucle `curl` hasta 30 segundos antes de lanzar Cypress, en lugar de un `sleep` fijo. |
| **El deploy no llega a tiempo durante la defensa.** | El workflow de deploy se dispara solo con cada push a `main` mediante el Deploy Hook de Render; no hay que entrar al panel. |
| **Bug en las reglas del ajedrez** (la parte con mas casos). | La logica esta aislada en `juego.ts`, sin Express ni React, y las pruebas E2E comprueban un movimiento valido y uno invalido de punta a punta. |
| **Conflicto de versiones de TypeScript.** Ocurrio de verdad: `typescript@7` no es compatible con el peer de `typescript-eslint@8`. | Se fijo `typescript` en `~6.0.2` en los dos proyectos. |

---

## Cambios importantes durante el desarrollo

1. **De "ajedrez normal" a "ajedrez con energia y misiones".**
   La primera idea era ajedrez clasico. Al revisar los lineamientos aparecio el problema:
   el ajedrez siempre empieza igual, asi que no cumplia el requisito de **variabilidad**, y
   sus estados se reducen a posicion y turno, con lo que tampoco cumplia **estado no
   trivial**. Se agregaron dos mecanicas pequenas pero suficientes: energia por movimiento
   (agrega recurso y decision estrategica) y mision aleatoria por partida (agrega
   variabilidad y objetivos). Fue el cambio mas importante del proyecto.

2. **Se quitaron jaque, mate, enroque y captura al paso.**
   Implementarlos bien significaba mucho mas codigo del necesario para el objetivo del
   examen. Se cambio la condicion de victoria a **capturar el rey**, que es facil de
   explicar y de probar automaticamente.

3. **El calculo de movimientos legales paso del frontend al backend.**
   Primero el frontend iba a calcular que casillas resaltar. Eso duplicaba las reglas en
   dos lugares y podia desincronizarse. Ahora el servidor devuelve `movimientosLegales`
   dentro de la respuesta y el frontend solo las pinta.

4. **El movimiento invalido se envia al servidor a proposito.**
   Cuando hay una pieza seleccionada y se hace clic en una casilla que no es un destino
   legal, el frontend **no bloquea** la accion: manda la jugada igual. Asi la validacion la
   hace de verdad el backend, el error viene del servidor y se puede probar con Cypress.

5. **React Compiler: de `babel-plugin-react-compiler` a `compiler: true`.**
   La configuracion inicial pasaba el plugin de Babel dentro de la opcion `babel` del
   plugin de React. La version 6 de `@vitejs/plugin-react` ya no acepta esa opcion: usa
   `oxc` y expone directamente `compiler: true` con el paquete `oxc-transform-react`.
   Se detecto porque `npm run build` fallo con `'babel' does not exist in type 'Options'`.

6. **`rootDir` explicito en el backend.**
   Con TypeScript 6, `tsc` fallaba con `TS5011` y generaba `dist/src/`. Se agrego
   `"rootDir": "src"` para que la salida quede en `dist/server.js`, que es lo que espera
   `npm start`.
