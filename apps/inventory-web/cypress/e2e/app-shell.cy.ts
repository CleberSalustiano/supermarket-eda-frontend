describe('Inventory web shell', () => {
  it('shows the inventory title', () => {
    cy.visit('/');
    cy.contains('Inventory Web').should('be.visible');
    cy.contains('Operational stock control without interface noise.').should('be.visible');
  });
});
