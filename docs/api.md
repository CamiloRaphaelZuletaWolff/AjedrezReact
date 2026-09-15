# Diseno de la API HTTP REST

Toda la comunicacion usa **JSON** de entrada y de salida. El frontend la consume con la API
nativa `fetch` desde `frontend/src/api.ts`, siempre con rutas relativas (`/api/...`), porque
frontend y backend viven en el mismo dominio y puerto.

Implementacion: `backend/src/server.ts`.

## Tabla resumen

| Metodo | Ruta | Entrada | Salida |
| --- | --- | --- | --- |
| `POST` | `/api/partidas` | `{ blancas, negras }` | `201` con el estado de la partida |
| `GET` | `/api/partidas/:id` | — | `200` con el estado de la partida |
| `POST` | `/api/partidas/:id/movimientos` | `{ desde, hasta }` | `200` con el estado nuevo |
| `GET` | `/api/historial` | — | `200` con las ultimas partidas terminadas |

## Como se numeran las casillas

El tablero viaja como un arreglo plano de 64 posiciones:

- indice `0` = **a8** (arriba a la izquierda), indice `63` = **h1** (abajo a la derecha)
- `fila = Math.floor(indice / 8)` — la fila 0 es la de las negras, la 7 la de las blancas
- `columna = indice % 8` — la columna 0 es la "a"

Ejemplos: `e2` = 52, `e4` = 36, `a7` = 8, `h5` = 31.

---

## 1. `POST /api/partidas`

Crea una partida nueva, arma el tablero inicial y **sortea la mision**.

### Entrada

```json
{
  "blancas": "Ana",
  "negras": "Beto"
}
```

### Salida correcta (`201 Created`)

El tablero se muestra recortado; en la respuesta real son 64 elementos.

```json
{
  "id": "p1",
  "jugadores": { "blancas": "Ana", "negras": "Beto" },
  "tablero": [
    { "tipo": "torre", "color": "negras" },
    { "tipo": "caballo", "color": "negras" },
    "... 62 posiciones mas, null donde la casilla esta vacia ..."
  ],
  "turno": "blancas",
  "energia": { "blancas": 6, "negras": 6 },
  "puntos": { "blancas": 0, "negras": 0 },
  "mision": {
    "tipo": "cruzar_peon",
    "descripcion": "Lleva 1 peon al lado rival del tablero",
    "objetivo": 1
  },
  "progresoMision": { "blancas": 0, "negras": 0 },
  "misionCumplida": { "blancas": false, "negras": false },
  "turnosJugados": 0,
  "turnosMaximos": 60,
  "estado": "en_curso",
  "ganador": null,
  "mensaje": "Comienzan las blancas. Mision de la partida: Lleva 1 peon al lado rival del tablero",
  "jugadas": [],
  "costeEnergia": { "peon": 1, "caballo": 2, "alfil": 2, "torre": 3, "dama": 4, "rey": 1 },
  "movimientosLegales": {
    "48": [40, 32],
    "49": [41, 33],
    "57": [40, 42]
  }
}
```

`movimientosLegales` es un mapa `casillaOrigen -> [casillasDestino]` de las piezas del
jugador que tiene el turno. El frontend solo lo usa para **pintar** las casillas
resaltadas; la validacion real vuelve a hacerla el servidor al recibir la jugada.

### Salida con error (`400 Bad Request`)

Cuando falta algun nombre:

```json
{ "error": "Los dos jugadores necesitan un nombre" }
```

### Ejemplo de solicitud

```bash
curl -X POST http://localhost:3000/api/partidas \
  -H "Content-Type: application/json" \
  -d '{"blancas":"Ana","negras":"Beto"}'
```

---

## 2. `GET /api/partidas/:id`

Devuelve el estado actual de la partida, con el mismo formato que el endpoint anterior.
Lo usa el boton "Actualizar desde el servidor".

### Salida correcta (`200 OK`)

Igual que el ejemplo de `POST /api/partidas`, con los valores del momento.

### Salida con error (`404 Not Found`)

```json
{ "error": "Esa partida no existe" }
```

### Ejemplo de solicitud

```bash
curl http://localhost:3000/api/partidas/p1
```

---

## 3. `POST /api/partidas/:id/movimientos`

Intenta mover una pieza. Es donde el backend toma la decision importante: comprueba el
turno, la legalidad del movimiento y la energia; y si todo esta bien aplica la captura,
los puntos, la mision y el fin de partida.

### Entrada

```json
{ "desde": 52, "hasta": 36 }
```

### Salida correcta (`200 OK`)

```json
{
  "id": "p1",
  "turno": "negras",
  "energia": { "blancas": 5, "negras": 9 },
  "puntos": { "blancas": 0, "negras": 0 },
  "turnosJugados": 1,
  "estado": "en_curso",
  "ganador": null,
  "mensaje": "Turno de Beto (negras).",
  "jugadas": ["Ana mueve peon e2 a e4"],
  "tablero": ["... 64 casillas actualizadas ..."],
  "movimientosLegales": { "8": [16, 24], "9": [17, 25] }
}
```

Se ve el efecto de la variante: las blancas gastaron 1 de energia (6 -> 5) y las negras
recuperaron 3 al empezar su turno (6 -> 9).

### Salida con error (`400 Bad Request`)

```json
{ "error": "Un peon no puede moverse de a7 a h5" }
```

Otros mensajes posibles: `No es el turno de las blancas`,
`Energia insuficiente: mover el dama cuesta 4 y tienes 3`,
`No hay ninguna pieza en esa casilla`, `La partida ya termino`.

### Ejemplo de solicitud

```bash
curl -X POST http://localhost:3000/api/partidas/p1/movimientos \
  -H "Content-Type: application/json" \
  -d '{"desde":52,"hasta":36}'
```

---

## 4. `GET /api/historial`

Devuelve las ultimas 10 partidas terminadas que guardo el servidor. Se muestra en la
pantalla de resultado.

### Salida (`200 OK`)

```json
{
  "historial": [
    {
      "id": "p2",
      "jugadores": { "blancas": "Ana", "negras": "Beto" },
      "ganador": "blancas",
      "puntos": { "blancas": 14, "negras": 3 },
      "turnos": 23
    }
  ]
}
```

### Ejemplo de solicitud

```bash
curl http://localhost:3000/api/historial
```

---

## Rutas que no son de la API

Cualquier ruta que no empiece con `/api/` la resuelve `express.static` con los archivos de
`frontend/dist`, y si no existe se devuelve `index.html`. Asi el juego completo se abre
desde una sola direccion.
