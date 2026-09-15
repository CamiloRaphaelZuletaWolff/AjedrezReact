# Ajedrez Relampago

Juego de ajedrez por turnos para dos jugadores, con una variante propia: **energia** y
**misiones aleatorias**. El frontend esta hecho con React + TypeScript (Vite) y el backend
con Express + TypeScript. Toda la logica del juego vive en el servidor.

- **Aplicacion publicada:** https://PENDIENTE.onrender.com  *(reemplazar por la URL real de Render)*
- **Documentacion detallada:** carpeta [`docs/`](docs/)

---

## Requisitos

- Node.js 22 o superior
- npm 10 o superior
- Google Chrome (para ver las pruebas E2E de forma visual)

## Instalacion

```bash
npm install          # instala Cypress (pruebas E2E)
npm run instalar     # instala las dependencias de backend/ y frontend/
```

## Comandos

| Comando | Que hace |
| --- | --- |
| `npm run instalar` | Instala las dependencias de `backend/` y `frontend/`. |
| `npm run lint` | Ejecuta ESLint en backend y frontend. Falla si hay errores. |
| `npm run build` | Compila el frontend con Vite y el backend con `tsc`. |
| `npm start` | Levanta Express en el puerto 3000 sirviendo el juego completo. |
| `npm run e2e` | Ejecuta Cypress en modo headless (Chrome). |
| `npm run e2e:visual` | Abre Cypress para ver las pruebas correr en Chrome. |

### Jugar en local (modo produccion, un solo puerto)

```bash
npm run instalar
npm run build
npm start
# abrir http://localhost:3000
```

### Desarrollo (dos procesos, con recarga en caliente)

```bash
# terminal 1
cd backend && npm run dev      # Express en http://localhost:3000

# terminal 2
cd frontend && npm run dev     # Vite en http://localhost:5173
```

En desarrollo, Vite reenvia las peticiones `/api/*` al backend (ver `frontend/vite.config.ts`),
asi que el frontend siempre usa rutas relativas y funciona igual en local y en produccion.

### Pruebas E2E

```bash
# 1. dejar el servidor corriendo en otra terminal
npm run build && npm start

# 2a. headless (lo mismo que corre GitHub Actions)
npm run e2e

# 2b. visual en Chrome (lo que se muestra en la defensa)
npm run e2e:visual
```

Para probar la **aplicacion publicada** en lugar de la local:

```bash
# PowerShell
$env:CYPRESS_BASE_URL="https://PENDIENTE.onrender.com"; npm run e2e:visual

# bash
CYPRESS_BASE_URL=https://PENDIENTE.onrender.com npm run e2e:visual
```

> **Si Cypress falla con `Cypress.exe: bad option: --smoke-test`**, la terminal tiene
> definida la variable `ELECTRON_RUN_AS_NODE` (pasa en las terminales integradas de algunos
> editores). Usar una terminal normal de Windows, o borrarla antes:
> `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue`

---

## Arquitectura

```
Ajedrez/
├── backend/            Express + TypeScript
│   └── src/
│       ├── juego.ts    Reglas del ajedrez, energia, misiones, fin de partida
│       └── server.ts   Rutas HTTP + servir el frontend compilado
├── frontend/           React + TypeScript + Vite
│   ├── public/piezas/  Imagenes PNG de las 12 piezas
│   └── src/
│       ├── api.ts      Unico archivo que usa fetch
│       ├── App.tsx     Estado de pantalla y manejo de clics
│       ├── Inicio.tsx  Pantalla de inicio e instrucciones
│       ├── Tablero.tsx Las 64 casillas
│       ├── Panel.tsx   Datos de un jugador (energia, puntos, mision)
│       └── Resultado.tsx  Pantalla final + historial
├── cypress/e2e/        Pruebas end-to-end
├── docs/               Documentacion del proyecto
└── .github/workflows/  Linters, E2E y deploy
```

**Un solo dominio y puerto.** En produccion Express sirve los archivos estaticos que Vite
dejo en `frontend/dist` y ademas responde la API en `/api/*`. No hay CORS ni dos servidores.

---

## Endpoints JSON

Todos reciben y devuelven JSON. Detalle completo con ejemplos en [`docs/api.md`](docs/api.md).

| Metodo | Ruta | Para que sirve |
| --- | --- | --- |
| `POST` | `/api/partidas` | Crea una partida y sortea la mision. |
| `GET` | `/api/partidas/:id` | Devuelve el estado actual de una partida. |
| `POST` | `/api/partidas/:id/movimientos` | Valida y aplica un movimiento. |
| `GET` | `/api/historial` | Devuelve las ultimas partidas terminadas. |

Ejemplo rapido:

```bash
curl -X POST http://localhost:3000/api/partidas \
  -H "Content-Type: application/json" \
  -d '{"blancas":"Ana","negras":"Beto"}'
```

---

## Variables de entorno

| Variable | Donde | Valor por defecto | Para que |
| --- | --- | --- | --- |
| `PORT` | backend | `3000` | Puerto del servidor. Render lo asigna solo. |
| `CYPRESS_BASE_URL` | Cypress | `http://localhost:3000` | URL contra la que corren las pruebas. |
| `RENDER_DEPLOY_HOOK` | GitHub Secret | — | URL del Deploy Hook de Render que usa el workflow de deploy. |

---

## Despliegue en Render

1. En Render: **New > Web Service**, conectar este repositorio.
2. Configuracion (ya esta en `render.yaml`):
   - Runtime: **Node**
   - Build Command: `npm run instalar && npm run build`
   - Start Command: `npm start`
3. Render asigna el puerto por `PORT`; el servidor ya lo lee.
4. En Render, **Settings > Deploy Hook**, copiar la URL.
5. En GitHub, **Settings > Secrets and variables > Actions > New repository secret**:
   nombre `RENDER_DEPLOY_HOOK`, valor la URL copiada.

A partir de ahi, cada push a `main` dispara el workflow `Deploy a Render` y la version
nueva queda publicada.

---

## GitHub Actions

Tres workflows separados en `.github/workflows/`:

1. **`linters.yml`** — ESLint del backend y del frontend, mas la compilacion de TypeScript.
   Falla si el codigo no cumple las reglas.
2. **`e2e.yml`** — construye la aplicacion, levanta Express y corre Cypress en Chrome headless.
3. **`deploy.yml`** — llama al Deploy Hook de Render para publicar la aplicacion completa.

---

## Imagenes de las piezas

Estan en `frontend/public/piezas/` con el nombre `{color}-{tipo}.png`
(`blancas-peon.png`, `negras-dama.png`, ...). Las actuales son placeholders
pixelados generados para el proyecto. Para cambiarlas basta con reemplazar
los archivos manteniendo el nombre; ver [`docs/decisiones.md`](docs/decisiones.md).
