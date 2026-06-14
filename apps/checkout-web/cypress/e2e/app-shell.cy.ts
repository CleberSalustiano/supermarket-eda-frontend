describe('Checkout web shell', () => {
  it('opens a cashier session from the operational shell', () => {
    cy.intercept('GET', '**/health', {
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-14T12:00:00.000Z'
    }).as('health');

    cy.intercept('POST', '**/pos-sessions', {
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      registerId: 'register-01',
      operatorId: 'cashier-01',
      openingFloatAmount: 150,
      declaredCashAmount: null,
      status: 'OPEN',
      openedAt: '2026-06-14T12:00:00.000Z',
      closedAt: null,
      createdAt: '2026-06-14T12:00:00.000Z',
      updatedAt: '2026-06-14T12:00:00.000Z'
    }).as('openSession');

    cy.visit('/');
    cy.wait('@health');

    cy.contains('Checkout Web').should('be.visible');
    cy.contains('Checkout execution is now operational.').should('be.visible');

    cy.get('input[placeholder="register-01"]').type('register-01');
    cy.get('input[placeholder="cashier-01"]').type('cashier-01');
    cy.get('input[placeholder="150.00"]').clear().type('150.00');
    cy.contains('button', 'Open session').click();

    cy.wait('@openSession');
    cy.contains('Session opened').should('be.visible');
    cy.contains('Register register-01 is now open for operator cashier-01.').should('be.visible');
  });
});
