describe('Checkout web shell', () => {
  it('shows the checkout title', () => {
    cy.visit('/');
    cy.contains('Checkout Web').should('be.visible');
    cy.contains('High-clarity POS foundations for fast execution.').should('be.visible');
  });
});
