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
      cancellationApprovedBy: null,
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
      cancellationApprovedBy: null,
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
      cancellationApprovedBy: null,
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
      cancellationApprovedBy: null,
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

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      }
    });
    cy.wait('@health');

    cy.contains('h1', 'Abrir caixa').should('be.visible');
    cy.contains('button', 'Abrir caixa').click();
    cy.wait('@openSession');

    cy.contains('button', 'Nova venda').click();
    cy.wait('@startSale');

    cy.focused().type('7891234567890{enter}');
    cy.wait('@addItem');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');

    // F8 focuses the empty amount; the exact total is typed; F8 again takes the payment.
    cy.get('body').trigger('keydown', { key: 'F8' });
    cy.focused().should('have.attr', 'inputmode', 'decimal').type('22,90');
    cy.get('body').trigger('keydown', { key: 'F8' });
    cy.wait('@processPayment').its('request.body').should('deep.equal', {
      tenantId: '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1',
      paymentMethod: 'CASH',
      paidAmount: 22.9
    });
    cy.contains('h2', 'Pagamento recebido').should('be.visible');

    cy.get('body').trigger('keydown', { key: 'F9' });
    cy.wait('@completeSale');
    cy.contains('Venda concluída às').should('be.visible');
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
      cancellationApprovedBy: null,
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
      cancellationApprovedBy: null,
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

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      }
    });
    cy.wait('@health');

    cy.contains('button', 'Abrir caixa').click();
    cy.wait('@openSession');

    cy.contains('button', 'Nova venda').click();
    cy.wait('@startSale');

    cy.focused().type('7891234567890{enter}');
    cy.wait('@addItem');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');

    cy.get('body').trigger('keydown', { key: 'F4' });
    cy.get('dialog[open]').within(() => {
      cy.contains('h2', 'Cancelar venda').should('be.visible');
      cy.focused().type('Customer gave up');
      cy.contains('button', 'Confirmar cancelamento').click();
    });
    cy.wait('@cancelSale').its('request.body').should('deep.equal', {
      tenantId,
      reason: 'Customer gave up'
    });
    cy.contains('Venda cancelada. Motivo: Customer gave up.').should('be.visible');

    cy.contains('button', 'Fechar caixa').click();
    cy.get('dialog[open]').within(() => {
      cy.contains('button', 'Fechar caixa').click();
    });
    cy.wait('@closeSession');
    cy.contains('Caixa register-01 fechado às').should('be.visible');
  });

  it('cancels a paid sale with manager code and PIN after 503 and 403 answers', () => {
    const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
    const saleId = 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1';
    const sessionId = '1c7281cc-c5ee-474a-884d-42d9b9be8293';
    const managerPin = '2468';
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
    const paidSale = {
      saleId,
      tenantId,
      sessionId,
      status: 'PAID',
      paymentMethod: 'CASH',
      paidAmount: 22.9,
      changeAmount: 0,
      paidAt: '2026-06-14T12:02:00.000Z',
      completedAt: null,
      canceledAt: null,
      cancellationReason: null,
      cancellationApprovedBy: null,
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
    };
    const errorBody = (statusCode: number, code: string) => ({
      statusCode,
      body: {
        statusCode,
        message: 'Backend detail that must not be shown',
        code,
        path: `/sales/${saleId}/cancellation`,
        correlationId: 'corr-approval',
        timestamp: '2026-06-14T12:03:00.000Z'
      }
    });

    cy.intercept('GET', '**/health', {
      serviceName: 'checkout-service',
      status: 'ok',
      timestamp: '2026-06-14T12:00:00.000Z'
    });
    let attempts = 0;
    cy.intercept('POST', '**/sales/*/cancellation', (request) => {
      attempts += 1;
      if (attempts === 1) {
        request.reply(errorBody(503, 'DEPENDENCY_UNAVAILABLE'));
      } else if (attempts === 2) {
        request.reply(errorBody(403, 'AUTHORIZATION_DENIED'));
      } else {
        request.reply({
          ...paidSale,
          status: 'CANCELED',
          canceledAt: '2026-06-14T12:04:00.000Z',
          cancellationReason: 'Wrong payment method',
          cancellationApprovedBy: {
            employeeId: '5a1d1c68-3a0c-4f0e-9f84-0f0f7d9a2b11',
            employeeCode: 'MANAGER-01',
            fullName: 'Bruno Lima'
          },
          eventPublicationStatus: 'published'
        });
      }
    }).as('cancelSale');

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.localStorage.setItem(
          'supermarket.checkout.workspace',
          JSON.stringify({ activeSession: session, activeSale: paidSale })
        );
      }
    });

    // Cypress cannot press Tab, so the fields are focused directly; submission is by Enter.
    cy.get('body').trigger('keydown', { key: 'F4' });
    cy.get('dialog[open]').within(() => {
      cy.focused().type('Wrong payment method');
      cy.get('input[autocapitalize="characters"]').type('manager-01');
      cy.get('input[type="password"]').should('have.attr', 'inputmode', 'numeric').type(`${managerPin}{enter}`);
    });
    cy.wait('@cancelSale');
    cy.get('dialog[open]').within(() => {
      cy.contains('Gestão indisponível, tente novamente. A venda não foi cancelada.').should('be.visible');
      cy.contains('Backend detail that must not be shown').should('not.exist');
      cy.get('input[type="password"]').should('have.value', '').and('have.focus');
      cy.get('input[autocapitalize="characters"]').should('have.value', 'manager-01');
      cy.get('input[type="password"]').type(`1357{enter}`);
    });
    cy.wait('@cancelSale');
    cy.get('dialog[open]').within(() => {
      cy.contains('Código do gerente ou PIN inválido.').should('be.visible');
      cy.get('input[type="password"]').should('have.value', '').and('have.focus').type(`${managerPin}{enter}`);
    });
    cy.wait('@cancelSale')
      .its('request.body')
      .should('deep.equal', {
        tenantId,
        reason: 'Wrong payment method',
        managerApproval: { employeeCode: 'MANAGER-01', pin: managerPin }
      });
    cy.contains('Venda cancelada. Motivo: Wrong payment method.').should('be.visible');
    cy.contains('Aprovado por Bruno Lima (MANAGER-01).').should('be.visible');
    cy.window().then((win) => {
      expect(JSON.stringify({ ...win.localStorage })).not.to.contain(managerPin);
    });
  });
});
