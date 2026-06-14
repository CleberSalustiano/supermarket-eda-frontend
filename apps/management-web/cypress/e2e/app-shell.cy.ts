describe('Management web shell', () => {
  it('shows the management title', () => {
    cy.visit('/');
    cy.contains('Management Web').should('be.visible');
    cy.contains('Operational command with low-noise design.').should('be.visible');
  });
});
