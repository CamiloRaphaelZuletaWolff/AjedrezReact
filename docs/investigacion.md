# Investigacion tecnica: pruebas E2E y publicacion

## Parte 1: pruebas end-to-end

### Herramientas que se compararon

| Herramienta | A favor | En contra |
| --- | --- | --- |
| **Cypress** | Se instala con un solo paquete; trae interfaz grafica que muestra cada paso; `cy.intercept` permite comprobar las llamadas HTTP reales; mucha documentacion en espanol. | El binario pesa mucho (~700 MB descomprimido); solo navegadores basados en Chromium y Firefox. |
| **Playwright** | Mas rapido, soporta mas navegadores, viene de Microsoft. | Su API es mas grande y para este proyecto no hacia falta probar varios navegadores. |
| **Selenium** | Es el estandar historico. | Configuracion mas pesada (drivers aparte) y no aporta nada extra aqui. |

**Se eligio Cypress** porque el enunciado pide ejecutar las pruebas *visualmente en Chrome*
durante la defensa, y `cypress open` hace exactamente eso: se ve el navegador, la lista de
pasos a la izquierda y se puede retroceder en el tiempo para revisar cada clic.

### Fuentes consultadas

- Documentacion oficial de Cypress: https://docs.cypress.io
  - "Writing Your First E2E Test" (estructura `describe` / `it`).
  - "Network Requests" (`cy.intercept` y `cy.wait("@alias")`).
  - "Cypress Configuration" (`baseUrl`, `supportFile`, variables `CYPRESS_*`).
- Documentacion de GitHub Actions sobre servicios y pasos en segundo plano:
  https://docs.github.com/actions
- Documentacion de Render sobre Deploy Hooks: https://render.com/docs/deploy-hooks

### Que prueban los tests

Archivo: `cypress/e2e/partida.cy.ts`. Hay dos pruebas.

1. **`no deja empezar la partida sin nombres`**
   Cubre el **inicio** y un **caso de validacion**: se visita la pagina, se pulsa
   "Empezar partida" con el formulario vacio y se comprueba que aparece el mensaje de error
   que devolvio el backend.

2. **`crea la partida, mueve un peon y rechaza un movimiento invalido`**
   Cubre la **interaccion principal** y la **comunicacion con el backend**:
   - `cy.intercept` registra las llamadas a `/api/partidas`, `/api/partidas/*/movimientos`
     y `GET /api/partidas/*`;
   - se crean los jugadores y se comprueba que la respuesta del `POST` fue `201`;
   - se hace clic en el peon de `e2` (casilla 52), se comprueba que la casilla `e4` (36) se
     resalto como destino, se hace clic y se comprueba que el `POST` respondio `200`;
   - se verifica en pantalla que el turno paso a las negras, que la energia de las blancas
     bajo de 6 a 5 y que la jugada aparece en el registro;
   - se pulsa "Actualizar desde el servidor" y se comprueba que el `GET` respondio `200`;
   - se intenta una jugada ilegal (peon de `a7` a `h5`), se comprueba que el servidor
     respondio `400`, que el mensaje de error se ve en pantalla y que **el turno no cambio**.

Las pruebas no hablan solo con el frontend: verifican codigos de estado HTTP reales, asi
que si el backend dejara de participar, fallarian.

### Como se ejecutan localmente

```bash
# 1. construir y levantar la aplicacion completa
npm run build
npm start

# 2. en otra terminal
npm run e2e          # headless, igual que en GitHub Actions
npm run e2e:visual   # abre Chrome y se ven las pruebas correr
```

Para probar la aplicacion **publicada** (lo que se muestra en la defensa):

```bash
# PowerShell
$env:CYPRESS_BASE_URL="https://ajedrez-relampago.onrender.com"; npm run e2e:visual
```

Cypress convierte automaticamente cualquier variable `CYPRESS_*` en la opcion de
configuracion correspondiente, asi que `CYPRESS_BASE_URL` reemplaza el `baseUrl` del
archivo `cypress.config.ts` sin cambiar el codigo.

### Como se ejecutan en GitHub Actions

El workflow `e2e.yml` hace, en este orden: instalar Cypress, instalar backend y frontend,
`npm run build`, levantar el servidor y esperar con un bucle `curl` hasta que responda, y
finalmente `npx cypress run --browser chrome`. `cypress run` es headless por defecto.
Si algo falla, sube las capturas de pantalla como artefacto.

### Limitaciones encontradas

- **El binario de Cypress pesa mucho.** La primera instalacion descarga unos 700 MB y
  tarda varios minutos, tanto en local como en CI.
- **`ELECTRON_RUN_AS_NODE` rompe Cypress.** Paso durante el desarrollo: `cypress run`
  fallaba con `Cypress.exe: bad option: --smoke-test`. La causa no era la instalacion
  (reinstalar el binario no lo arreglo) sino que la terminal tenia definida la variable
  `ELECTRON_RUN_AS_NODE=1`. Cypress es una aplicacion Electron, y con esa variable el
  ejecutable arranca como Node normal y no reconoce sus propias opciones. Ocurre en las
  terminales integradas de algunos editores. Solucion: usar una terminal limpia
  (PowerShell o CMD fuera del editor) o borrar la variable antes de ejecutar:

  ```powershell
  Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
  npm run e2e
  ```

- **Se fijo Cypress 15 y no 16.** La version 16 no llego a funcionar en el equipo de
  desarrollo, asi que en `package.json` esta fijada `cypress@^15.21.1`, que si funciona
  tanto en local como en GitHub Actions.
- **Hay que levantar el servidor aparte.** Cypress no arranca la aplicacion; por eso en CI
  se lanza `npm start &` y se espera con `curl` en vez de un `sleep` fijo, que seria
  inestable.
- **Los indices de las casillas son numeros, no nombres.** En las pruebas hay que traducir
  `e2` a `52`. Se dejo un comentario con la formula al principio del archivo.

---

## Parte 2: publicacion de la aplicacion

### Servicio elegido: Render

Se compararon tres opciones:

| Servicio | Resultado |
| --- | --- |
| **GitHub Pages** | Descartado: solo sirve archivos estaticos, no puede correr Express. El proyecto necesita backend. |
| **Vercel** | Funciona, pero obliga a convertir Express en funciones serverless. Como el estado de las partidas vive en memoria del proceso, se perderia entre peticiones. |
| **Render** | Corre un proceso Node normal, con `npm start` y un puerto. El estado en memoria se mantiene mientras el servicio este despierto. Tiene plan gratuito y lo recomienda el enunciado. |

### Configuracion del servicio

Esta en `render.yaml` y tambien se puede poner a mano en el panel:

- **Runtime:** Node
- **Build Command:** `npm run instalar && npm run build`
- **Start Command:** `npm start`
- **Root Directory:** la raiz del repositorio

El build instala las dependencias de `backend/` y `frontend/`, compila el frontend con Vite
(genera `frontend/dist`) y compila el backend con `tsc` (genera `backend/dist`).
`npm start` ejecuta `node backend/dist/server.js`.

### Configuracion del puerto

Render no deja elegir el puerto: lo asigna y lo entrega en la variable de entorno `PORT`.
Por eso el servidor lee:

```ts
const puerto = Number(process.env.PORT ?? 3000);
```

Si `PORT` no existe (en local), usa 3000. Si el servidor escuchara un puerto fijo, Render
marcaria el deploy como fallido porque no detecta un puerto abierto.

### Variables de entorno

| Variable | Donde se configura | Valor |
| --- | --- | --- |
| `PORT` | Render, automatico | lo asigna Render |
| `NODE_VERSION` | Render (`render.yaml`) | `22` |
| `RENDER_DEPLOY_HOOK` | GitHub > Settings > Secrets and variables > Actions | la URL del Deploy Hook |

### Publicacion automatica desde GitHub Actions

Render tiene una funcion llamada **Deploy Hook**: una URL secreta a la que se le hace
`POST` para pedir un despliegue nuevo. Se guarda como secreto de GitHub y el workflow
`deploy.yml` la llama en cada push a `main`:

```yaml
- name: Pedir a Render que publique la ultima version
  run: |
    respuesta=$(curl -sf -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}")
    echo "Respuesta de Render: $respuesta"
```

Render responde con el id del deploy, que queda impreso en el log del workflow. Asi el
cambio que pida el docente durante la defensa llega a la web publicada sin entrar al panel
de Render.

### Limitaciones del plan gratuito

- El servicio **se duerme** despues de 15 minutos sin visitas; la primera peticion tarda
  alrededor de 50 segundos en despertarlo. Antes de la defensa conviene abrir la URL.
- Cada deploy vuelve a construir todo (2-4 minutos).
- Al reiniciarse el servicio se pierden las partidas en memoria (ver riesgos en
  `decisiones.md`).

### Sobre Docker

**No se uso Docker.** Render detecta un proyecto Node y lo construye solo con el build
command y el start command, asi que un `Dockerfile` seria una capa extra sin beneficio para
este proyecto. El enunciado indica que Docker es opcional y depende del servicio elegido.
