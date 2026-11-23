const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';

describe('Management web shell', () => {
  it('registers a product at /produtos', () => {
    cy.intercept('GET', '**/health', {
      statusCode: 200,
      body: { serviceName: 'management-service', status: 'ok', timestamp: '2026-06-14T00:00:00.000Z' }
    }).as('health');

    cy.intercept('POST', '**/products', (request) => {
      expect(request.body).to.deep.equal({
        tenantId,
        name: 'Café Arábica 1kg',
        barcode: '7891234567890',
        unitOfMeasure: 'UN',
        price: 22.9
      });

      request.reply({
        statusCode: 201,
        body: {
          productId: '0b4f3405-a406-4bbd-b4fe-ec85f7765d20',
          tenantId,
          name: 'Café Arábica 1kg',
          barcode: '7891234567890',
          unitOfMeasure: 'UN',
          currentPrice: 22.9,
          active: true,
          eventPublicationStatus: 'published'
        }
      });
    }).as('registerProduct');

    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      }
    });
    cy.wait('@health');

    cy.location('pathname').should('eq', '/produtos');
    cy.contains('h1', 'Produtos').should('be.visible');
    cy.get('label').contains('Nome do produto').parent().find('input').type('Café Arábica 1kg');
    cy.get('label').contains('Código de barras').first().parent().find('input').type('7891234567890');
    cy.get('label').contains('Preço de venda').parent().find('input').type('22,90');
    cy.contains('button', 'Cadastrar produto').click();

    cy.wait('@registerProduct');
    cy.contains('Produto cadastrado: Café Arábica 1kg.').should('be.visible');
  });

  it('registers an employee at /funcionarios', () => {
    cy.intercept('GET', '**/health', {
      statusCode: 200,
      body: { serviceName: 'management-service', status: 'ok', timestamp: '2026-06-14T00:00:00.000Z' }
    });
    cy.intercept('POST', '**/employees', (request) => {
      expect(request.body).to.deep.equal({
        tenantId,
        employeeCode: 'CASHIER-02',
        fullName: 'Maria Souza',
        role: 'MANAGER',
        pin: '123456'
      });

      request.reply({
        statusCode: 201,
        body: {
          employeeId: '3c1a5f0e-1111-4222-8333-444455556666',
          tenantId,
          employeeCode: 'CASHIER-02',
          fullName: 'Maria Souza',
          role: 'MANAGER',
          active: true,
          eventPublicationStatus: 'published'
        }
      });
    }).as('registerEmployee');

    cy.intercept('GET', '**/employees*', { statusCode: 200, body: { items: [], total: 0, limit: 200, offset: 0 } });

    cy.visit('/funcionarios', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      }
    });

    cy.get('label').contains('Código do funcionário').parent().find('input').type('CASHIER-02');
    cy.get('label').contains('Nome completo').parent().find('input').type('Maria Souza');
    cy.get('label').contains('Função').parent().find('select').select('Gerente');
    cy.get('label').contains('PIN').parent().find('input').type('123456');
    cy.contains('button', 'Cadastrar funcionário').click();

    cy.wait('@registerEmployee');
    cy.contains('Funcionário cadastrado: Maria Souza.').should('be.visible');
  });

  it('lists, deactivates and changes the PIN of employees at /funcionarios', () => {
    const maria = {
      employeeId: '3c1a5f0e-1111-4222-8333-444455556666',
      tenantId,
      employeeCode: 'MANAGER-01',
      fullName: 'Maria Souza',
      role: 'MANAGER',
      active: true,
      deactivatedAt: null,
      createdAt: '2026-11-20T12:00:00.000Z',
      updatedAt: '2026-11-20T12:00:00.000Z'
    };
    let deactivated = false;

    cy.intercept('GET', '**/health', {
      statusCode: 200,
      body: { serviceName: 'management-service', status: 'ok', timestamp: '2026-06-14T00:00:00.000Z' }
    });
    cy.intercept('GET', '**/employees*', (request) => {
      const item = deactivated ? { ...maria, active: false, deactivatedAt: '2026-11-23T10:00:00.000Z' } : maria;

      request.reply({ statusCode: 200, body: { items: [item], total: 1, limit: 200, offset: 0 } });
    }).as('listEmployees');
    cy.intercept('PUT', `**/employees/${maria.employeeId}/pin`, (request) => {
      expect(request.body).to.deep.equal({ tenantId, pin: '2468' });
      request.reply({
        statusCode: 200,
        body: { employeeId: maria.employeeId, tenantId, employeeCode: 'MANAGER-01', pinChangedAt: '2026-11-23T10:00:00.000Z' }
      });
    }).as('changePin');
    cy.intercept('POST', `**/employees/${maria.employeeId}/deactivation`, (request) => {
      expect(request.body).to.deep.equal({ tenantId });
      deactivated = true;
      request.reply({ statusCode: 200, body: { ...maria, active: false, deactivatedAt: '2026-11-23T10:00:00.000Z' } });
    }).as('deactivate');

    cy.visit('/funcionarios', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      }
    });
    cy.wait('@listEmployees');
    cy.contains('td', 'MANAGER-01').should('be.visible');

    cy.contains('button', 'Trocar PIN').click();
    cy.get('dialog[open]').within(() => {
      cy.get('label').contains('Novo PIN').parent().find('input').type('2468');
      cy.get('label').contains('Confirme o novo PIN').parent().find('input').type('2468');
      cy.contains('button', 'Salvar PIN').click();
    });
    cy.wait('@changePin');
    cy.contains('PIN de Maria Souza alterado.').should('be.visible');

    cy.contains('button', 'Desativar').click();
    cy.get('dialog[open]').within(() => {
      cy.contains('não poderá mais aprovar cancelamentos').should('be.visible');
      cy.contains('button', 'Desativar').click();
    });
    cy.wait('@deactivate');
    cy.wait('@listEmployees');
    cy.contains('Maria Souza foi desativado.').should('be.visible');
    cy.contains('Inativo desde').should('be.visible');
  });

  it('generates the profit and loss statement at /resultado', () => {
    cy.intercept('GET', '**/health', {
      statusCode: 200,
      body: { serviceName: 'management-service', status: 'ok', timestamp: '2026-06-14T00:00:00.000Z' }
    });
    cy.intercept('GET', '**/reports/profit-and-loss*', {
      statusCode: 200,
      body: {
        tenantId,
        fromDate: '2026-11-01',
        toDate: '2026-11-22',
        revenueNetTotal: 12345.6,
        inventoryLossTotal: 210,
        profitAndLossTotal: 12135.6,
        netSalesCount: 132,
        soldItemsQuantity: 410,
        lossEventsCount: 3,
        lossItemsQuantity: 12,
        days: []
      }
    }).as('report');

    cy.visit('/resultado', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      }
    });
    cy.get('label').contains('De').parent().find('input').invoke('val', '2026-11-01').trigger('change');
    cy.get('label').contains('Até').parent().find('input').invoke('val', '2026-11-22').trigger('change');
    cy.contains('button', 'Gerar relatório').click();

    cy.wait('@report');
    cy.contains('h2', 'Resultado de 01/11/2026 a 22/11/2026').should('be.visible');
    cy.contains('Nenhuma venda ou perda registrada nesse período.').should('be.visible');
  });
});
