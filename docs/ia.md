# Registro del uso de agentes de IA

Este proyecto se desarrollo con la ayuda de un agente de IA (Claude Code), tal como permite
el enunciado. Aqui queda registrado que se le pidio, que se incorporo y que se verifico.

## Solicitudes relevantes que se hicieron a la IA

1. **Estructura del proyecto.**
   Se pidio crear desde cero un proyecto con React + TypeScript + Vite para el frontend y
   Express + TypeScript para el backend, sin librerias externas mas alla de ESLint y
   Cypress, siguiendo la misma configuracion que se uso en clase.
   *Se incorporo completo.*

2. **Diseno del juego.**
   Se pregunto si el ajedrez clasico cumplia los lineamientos del enunciado. La IA senalo
   que el ajedrez puro no cumple **variabilidad** (todas las partidas empiezan igual) ni
   **estado no trivial** (solo posicion y turno), y propuso agregar energia por movimiento
   y una mision aleatoria por partida.
   *Se incorporo la propuesta; ver el cambio 1 de `decisiones.md`.*

3. **Logica del ajedrez** (`backend/src/juego.ts`).
   Se pidio implementar los movimientos de las seis piezas sin enroque, sin captura al paso
   y sin jaque, con la victoria por captura del rey.
   *Se incorporo. Se verifico jugando partidas completas contra la API.*

4. **API REST.**
   Se pidio el diseno de los cuatro endpoints y que la validacion viviera en el servidor.
   *Se incorporo.*

5. **Pruebas E2E con Cypress.**
   Se pidieron pruebas simples que cubrieran inicio, validacion, un movimiento valido, un
   movimiento invalido y la comunicacion HTTP real.
   *Se incorporo, con `cy.intercept` para comprobar los codigos de estado.*

6. **GitHub Actions.**
   Se pidieron tres workflows separados y lo mas simples posible: linters, E2E y deploy.
   *Se incorporo.*

7. **Imagenes de las piezas.**
   Se pidieron placeholders y las caracteristicas que deben cumplir las imagenes
   definitivas.
   *Se incorporaron 12 PNG de 64x64 generados como pixel art, y la lista de requisitos
   quedo en `decisiones.md`.*

## Respuestas de la IA que NO se incorporaron

- La primera configuracion del React Compiler usaba `babel-plugin-react-compiler` dentro de
  la opcion `babel` del plugin de React. **No funciono**: `@vitejs/plugin-react` v6 ya no
  acepta esa opcion. Se reemplazo por `compiler: true` con `oxc-transform-react`.
- La version inicial de las dependencias ponia `typescript@^7`, que es incompatible con el
  peer de `typescript-eslint@8`. Se bajo a `~6.0.2`.
- El `tsconfig.json` del backend no tenia `rootDir`, y con TypeScript 6 eso genera el error
  `TS5011` y deja la salida en `dist/src/`. Se agrego `"rootDir": "src"`.
- Cypress 16 se descarto tras fallar en el equipo de desarrollo; se fijo la version 15.

## Que se verifico manualmente

Antes de dar el proyecto por terminado se comprobo cada punto:

| Verificacion | Resultado |
| --- | --- |
| `npm run lint` en backend y frontend | sin errores |
| `npm run build` (tsc + Vite + tsc) | compila |
| `POST /api/partidas` con nombres | responde `201` con el tablero completo |
| `POST /api/partidas` con nombres vacios | responde `400` con el mensaje de error |
| `POST /api/partidas/p1/movimientos` con `e2 -> e4` | responde `200`, energia 6 -> 5, turno pasa a negras |
| `POST` con una jugada ilegal (`a7 -> h5`) | responde `400` y el turno no cambia |
| `GET /api/partidas/:id` y `GET /api/historial` | responden JSON correcto |
| Partidas completas jugadas contra la API | terminan por captura del rey y por limite de 60 turnos, sin errores |
| Mision sorteada | cambia entre partidas (se vieron las tres) |
| Las 32 imagenes del tablero | cargan sin errores 404 |
| La pagina no genera scroll horizontal | verificado a 1440x900 y a 420x800 |
| `npx cypress run --browser chrome` | 2 pruebas, 2 pasadas |

## Compromiso

El codigo del proyecto se leyo y se entiende. Los archivos estan comentados en espanol,
la logica del juego esta concentrada en un solo archivo (`backend/src/juego.ts`) y los
componentes de React son pequenos y con una sola responsabilidad cada uno, justamente para
poder explicarlos y modificarlos durante la defensa.
