describe('Inventory web shell', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/health', {
      body: { serviceName: 'inventory-service', status: 'ok', timestamp: '2026-11-22T12:00:00.000Z' }
    });
  });

  it('shows the honest empty state', () => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() });
    cy.contains('h1', 'Início').should('be.visible');
    cy.contains('Nenhuma operação de estoque disponível ainda').should('be.visible');
    cy.contains('Estoque').should('be.visible');
    cy.contains('Healthy').should('not.exist');
  });
});
