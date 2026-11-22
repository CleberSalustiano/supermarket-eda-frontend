describe('Checkout web shell', () => {
  it('moves from session opening to receipt completion', () => {
    cy.intercept('GET', '**/health', {
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-14T12:00:00.000Z'
    }).as('health');

    cy.intercept('POST', '**/pos-sessions', {
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      registerId: 'register-01',
      operatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e',
      openingFloatAmount: 150,
      declaredCashAmount: null,
      status: 'OPEN',
      openedAt: '2026-06-14T12:00:00.000Z',
      closedAt: null,
      createdAt: '2026-06-14T12:00:00.000Z',
      updatedAt: '2026-06-14T12:00:00.000Z'
    }).as('openSession');

    cy.intercept('POST', '**/sales', {
      saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      status: 'OPEN',
      paymentMethod: null,
      paidAmount: null,
      changeAmount: null,
      paidAt: null,
      completedAt: null,
      canceledAt: null,
      cancellationReason: null,
      totalItemsQuantity: 0,
      subtotal: 0,
      total: 0,
      items: [],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:01:00.000Z'
    }).as('startSale');

    cy.intercept('POST', '**/sales/*/items', {
      saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      status: 'OPEN',
      paymentMethod: null,
      paidAmount: null,
      changeAmount: null,
      paidAt: null,
      completedAt: null,
      canceledAt: null,
      cancellationReason: null,
      totalItemsQuantity: 1,
      subtotal: 22.9,
      total: 22.9,
      items: [
        {
          productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
          barcode: '7891234567890',
          name: 'Arabica coffee beans 1kg',
          unitOfMeasure: 'UN',
          unitPrice: 22.9,
          quantity: 1,
          lineTotal: 22.9
        }
      ],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:02:00.000Z'
    }).as('addItem');

    cy.intercept('POST', '**/sales/*/payment', {
      saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      status: 'PAID',
      paymentMethod: 'CASH',
      paidAmount: 22.9,
      changeAmount: 0,
      paidAt: '2026-06-14T12:03:00.000Z',
      completedAt: null,
      canceledAt: null,
      cancellationReason: null,
      totalItemsQuantity: 1,
      subtotal: 22.9,
      total: 22.9,
      items: [
        {
          productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
          barcode: '7891234567890',
          name: 'Arabica coffee beans 1kg',
          unitOfMeasure: 'UN',
          unitPrice: 22.9,
          quantity: 1,
          lineTotal: 22.9
        }
      ],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:03:00.000Z'
    }).as('processPayment');

    cy.intercept('POST', '**/sales/*/completion', {
      saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      paidAmount: 22.9,
      changeAmount: 0,
      paidAt: '2026-06-14T12:03:00.000Z',
      completedAt: '2026-06-14T12:04:00.000Z',
      canceledAt: null,
      cancellationReason: null,
      totalItemsQuantity: 1,
      subtotal: 22.9,
      total: 22.9,
      items: [
        {
          productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
          barcode: '7891234567890',
          name: 'Arabica coffee beans 1kg',
          unitOfMeasure: 'UN',
          unitPrice: 22.9,
          quantity: 1,
          lineTotal: 22.9
        }
      ],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:04:00.000Z',
      eventPublicationStatus: 'published',
      receipt: {
        saleId: 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1',
        tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
        sessionId: '1c7281cc-c5ee-474a-884d-42d9b9be8293',
        paymentMethod: 'CASH',
        paidAmount: 22.9,
        changeAmount: 0,
        totalItemsQuantity: 1,
        total: 22.9,
        completedAt: '2026-06-14T12:04:00.000Z',
        issuedAt: '2026-06-14T12:04:00.000Z',
        items: [
          {
            productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
            barcode: '7891234567890',
            name: 'Arabica coffee beans 1kg',
            unitOfMeasure: 'UN',
            unitPrice: 22.9,
            quantity: 1,
            lineTotal: 22.9
          }
        ]
      }
    }).as('completeSale');

    cy.visit('/');
    cy.wait('@health');

    cy.contains('Checkout Web').should('be.visible');
    cy.contains('Checkout execution now reaches terminal flows.').should('be.visible');

    cy.contains('button', 'Open session').click();
    cy.wait('@openSession');
    cy.contains('Session opened').should('be.visible');

    cy.contains('button', 'Start sale').click();
    cy.wait('@startSale');
    cy.contains('Sale started').should('be.visible');

    cy.get('input[placeholder="7891234567890"]').type('7891234567890');
    cy.get('input[placeholder="1"]').clear().type('1');
    cy.contains('button', 'Add item').click();
    cy.wait('@addItem');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');

    cy.contains('button', 'Use exact total').click();
    cy.contains('button', 'Process payment').click();
    cy.wait('@processPayment');
    cy.contains('Payment captured').should('be.visible');

    cy.contains('button', 'Complete sale').click();
    cy.wait('@completeSale');
    cy.contains('Sale completed').should('be.visible');
    cy.contains('Receipt summary').should('be.visible');
    cy.contains('Completion event published.').should('be.visible');
  });

  it('cancels an open sale and closes the register', () => {
    const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
    const saleId = 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1';
    const sessionId = '1c7281cc-c5ee-474a-884d-42d9b9be8293';
    const item = {
      productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
      barcode: '7891234567890',
      name: 'Arabica coffee beans 1kg',
      unitOfMeasure: 'UN',
      unitPrice: 22.9,
      quantity: 1,
      lineTotal: 22.9
    };
    const session = {
      sessionId,
      tenantId,
      registerId: 'register-01',
      operatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e',
      openingFloatAmount: 150,
      declaredCashAmount: null,
      status: 'OPEN',
      openedAt: '2026-06-14T12:00:00.000Z',
      closedAt: null,
      createdAt: '2026-06-14T12:00:00.000Z',
      updatedAt: '2026-06-14T12:00:00.000Z'
    };
    const openSale = {
      saleId,
      tenantId,
      sessionId,
      status: 'OPEN',
      paymentMethod: null,
      paidAmount: null,
      changeAmount: null,
      paidAt: null,
      completedAt: null,
      canceledAt: null,
      cancellationReason: null,
      totalItemsQuantity: 0,
      subtotal: 0,
      total: 0,
      items: [],
      createdAt: '2026-06-14T12:01:00.000Z',
      updatedAt: '2026-06-14T12:01:00.000Z'
    };
    const saleWithItem = {
      ...openSale,
      totalItemsQuantity: 1,
      subtotal: 22.9,
      total: 22.9,
      items: [item],
      updatedAt: '2026-06-14T12:02:00.000Z'
    };

    cy.intercept('GET', '**/health', {
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-14T12:00:00.000Z'
    }).as('health');
    cy.intercept('POST', '**/pos-sessions', session).as('openSession');
    cy.intercept('POST', '**/sales', openSale).as('startSale');
    cy.intercept('POST', '**/sales/*/items', saleWithItem).as('addItem');
    cy.intercept('POST', '**/sales/*/cancellation', {
      ...saleWithItem,
      status: 'CANCELED',
      canceledAt: '2026-06-14T12:03:00.000Z',
      cancellationReason: 'Customer gave up',
      updatedAt: '2026-06-14T12:03:00.000Z',
      eventPublicationStatus: 'published'
    }).as('cancelSale');
    cy.intercept('POST', '**/pos-sessions/*/closure', {
      ...session,
      status: 'CLOSED',
      declaredCashAmount: 150,
      closedAt: '2026-06-14T18:00:00.000Z',
      updatedAt: '2026-06-14T18:00:00.000Z',
      eventPublicationStatus: 'published'
    }).as('closeSession');

    cy.visit('/');
    cy.wait('@health');

    cy.contains('button', 'Open session').click();
    cy.wait('@openSession');
    cy.contains('Session opened').should('be.visible');

    cy.contains('button', 'Start sale').click();
    cy.wait('@startSale');

    cy.get('input[placeholder="7891234567890"]').type('7891234567890');
    cy.get('input[placeholder="1"]').clear().type('1');
    cy.contains('button', 'Add item').click();
    cy.wait('@addItem');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');

    cy.get('input[placeholder="Customer requested reversal"]').type('Customer gave up');
    cy.contains('button', 'Cancel sale').click();
    cy.wait('@cancelSale').its('request.body').should('deep.equal', {
      tenantId,
      reason: 'Customer gave up'
    });
    cy.contains('Sale canceled').should('be.visible');
    cy.contains('Cancellation summary').should('be.visible');

    cy.contains('button', 'Close session').click();
    cy.wait('@closeSession');
    cy.contains('Session closed').should('be.visible');
    cy.contains('Session closure summary').should('be.visible');
  });
});
