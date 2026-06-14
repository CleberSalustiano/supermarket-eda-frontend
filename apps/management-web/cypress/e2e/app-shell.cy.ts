describe('Management web shell', () => {
  it('registers a product through the form', () => {
    cy.intercept('GET', '**/health', {
      statusCode: 200,
      body: {
        serviceName: 'management-service',
        status: 'ok',
        timestamp: '2026-06-14T00:00:00.000Z'
      }
    }).as('health');

    cy.intercept('POST', '**/products', (request) => {
      expect(request.body).to.deep.equal({
        tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
        name: 'Arabica Coffee Beans',
        barcode: '7891234567890',
        unitOfMeasure: 'UN',
        price: 22.9
      });

      request.reply({
        statusCode: 201,
        body: {
          productId: '0b4f3405-a406-4bbd-b4fe-ec85f7765d20',
          tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
          name: 'Arabica Coffee Beans',
          barcode: '7891234567890',
          unitOfMeasure: 'UN',
          currentPrice: 22.9,
          active: true,
          eventPublicationStatus: 'published'
        }
      });
    }).as('registerProduct');

    cy.visit('/');
    cy.wait('@health');

    cy.contains('Management workflows are now executable.').should('be.visible');
    cy.get('input[placeholder="Arabica coffee beans 1kg"]').type('Arabica Coffee Beans');
    cy.get('input[placeholder="7891234567890"]').type('7891234567890');
    cy.get('input[placeholder="22.90"]').type('22.90');
    cy.contains('button', 'Register product').click();

    cy.wait('@registerProduct');
    cy.contains('Product registered').should('be.visible');
    cy.contains('Arabica Coffee Beans was created').should('be.visible');
  });
});
