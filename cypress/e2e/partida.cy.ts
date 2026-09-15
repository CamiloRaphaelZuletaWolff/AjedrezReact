// -----------------------------------------------------------------------------
// Pruebas end-to-end con Cypress.
// Cubren: el inicio, una validacion, la interaccion principal (mover una pieza),
// la comunicacion real con el backend y un movimiento invalido.
//
// Recordatorio de indices del tablero: 0 = a8 (arriba izquierda), 63 = h1.
//   e2 = 52    e4 = 36    a7 = 8    h5 = 31
// -----------------------------------------------------------------------------

describe("Ajedrez Relampago", () => {
    it("no deja empezar la partida sin nombres", () => {
        cy.visit("/");
        cy.contains("Ajedrez Relampago").should("be.visible");

        cy.contains("Empezar partida").click();
        cy.get("[data-cy=error]").should("contain", "nombre");
    });

    it("crea la partida, mueve un peon y rechaza un movimiento invalido", () => {
        cy.intercept("POST", "/api/partidas").as("crear");
        cy.intercept("POST", "/api/partidas/*/movimientos").as("mover");
        cy.intercept("GET", "/api/partidas/*").as("leer");

        // --- Inicio ---
        cy.visit("/");
        cy.get("#blancas").type("Ana");
        cy.get("#negras").type("Beto");
        cy.contains("Empezar partida").click();

        // La partida la crea el backend: se comprueba la respuesta HTTP.
        cy.wait("@crear").its("response.statusCode").should("eq", 201);

        cy.get("[data-cy=tablero]").should("be.visible");
        cy.get("[data-cy=turno]").should("contain", "Ana");
        cy.get("[data-cy=energia-blancas]").should("contain", "6");
        cy.get("[data-cy=panel-blancas]").should("contain", "Mision");

        // --- Interaccion principal: mover el peon de e2 a e4 ---
        cy.get("[data-cy=casilla-52]").click();
        cy.get("[data-cy=casilla-36]").should("have.class", "destino");
        cy.get("[data-cy=casilla-36]").click();

        cy.wait("@mover").its("response.statusCode").should("eq", 200);

        // El estado que devolvio el servidor se ve en la interfaz.
        cy.get("[data-cy=turno]").should("contain", "Beto");
        cy.get("[data-cy=energia-blancas]").should("contain", "5");
        cy.get("[data-cy=jugadas]").should("contain", "e2 a e4");

        // --- El endpoint GET tambien se usa de verdad ---
        cy.get("[data-cy=boton-actualizar]").click();
        cy.wait("@leer").its("response.statusCode").should("eq", 200);

        // --- Caso invalido: un peon de a7 no puede saltar a h5 ---
        cy.get("[data-cy=casilla-8]").click();
        cy.get("[data-cy=casilla-31]").click();

        cy.wait("@mover").its("response.statusCode").should("eq", 400);
        cy.get("[data-cy=error]").should("contain", "no puede moverse");

        // El turno no cambio porque la jugada fue rechazada.
        cy.get("[data-cy=turno]").should("contain", "Beto");
    });
});
