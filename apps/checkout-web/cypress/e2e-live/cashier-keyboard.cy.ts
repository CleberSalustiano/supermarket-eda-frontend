// Real local stack, no intercepts. After the first visit the cashier flow is keyboard-only
// (Cypress cannot press F-keys, so they are dispatched as keydown events on the page).
function pressKey(key: string): void {
  cy.get('body').trigger('keydown', { key });
}

describe('Cashier keyboard walkthrough (live stack)', () => {
  it('opens the register, sells two products, takes cash and closes the register', () => {
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      }
    });

    cy.contains('h1', 'Abrir caixa').should('be.visible');
    cy.get('input[inputmode="decimal"]').should('have.value', '150,00').type('{enter}');

    pressKey('F2');
    cy.get('input[inputmode="numeric"]').should('not.be.disabled');

    cy.focused().type('7891234567890{enter}');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');
    cy.get('[role="img"]')
      .invoke('attr', 'aria-label')
      .should('match', /^Total da venda: R\$\s22,90$/);

    cy.focused().type('2*7891000100013{enter}');
    cy.contains('Whole milk 1L').should('be.visible');
    cy.get('[role="img"]')
      .invoke('attr', 'aria-label')
      .should('match', /^Total da venda: R\$\s32,88$/);

    pressKey('F8');
    cy.focused().should('have.attr', 'inputmode', 'decimal').type('32,88');
    pressKey('F8');
    cy.contains('h2', 'Pagamento recebido').should('be.visible');

    pressKey('F9');
    cy.contains('Venda concluída às').should('be.visible');

    // Cypress cannot press Enter on a button (only Tab), so activating the focused button is a click.
    cy.contains('button', 'Fechar caixa').focus().click();
    cy.get('dialog[open]').should('be.visible');
    cy.focused().type('{enter}');

    cy.contains(/Caixa register-01 fechado às .* Dinheiro declarado/).should('be.visible');
  });
});
