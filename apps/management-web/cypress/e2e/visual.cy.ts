const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
const productId = '0b4f3405-a406-4bbd-b4fe-ec85f7765d20';
const employeeId = '3c1a5f0e-1111-4222-8333-444455556666';

const themes = ['light', 'dark'] as const;
const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '375', width: 375, height: 812 }
] as const;

const recentProducts = [
  {
    productId,
    name: 'Café Arábica 1kg',
    barcode: '7891234567890',
    unitOfMeasure: 'UN',
    currentPrice: 22.9,
    updatedAt: '2026-11-22T12:00:00.000Z'
  },
  {
    productId: '1c5f4506-b517-4cce-8dfd-fe5f8876ae31',
    name: 'Leite integral 1L',
    barcode: '7891000100013',
    unitOfMeasure: 'UN',
    currentPrice: 4.99,
    updatedAt: '2026-11-22T11:00:00.000Z'
  }
];

const employeeList = (items: unknown[]) => ({ items, total: items.length, limit: 200, offset: 0 });

const employees = [
  {
    employeeId,
    tenantId,
    employeeCode: 'MANAGER-01',
    fullName: 'Maria Souza',
    role: 'MANAGER',
    active: true,
    deactivatedAt: null,
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-20T12:00:00.000Z'
  },
  {
    employeeId: '4d2b6a1f-2222-4333-9444-555566667777',
    tenantId,
    employeeCode: 'CASHIER-01',
    fullName: 'João Lima',
    role: 'CASHIER',
    active: false,
    deactivatedAt: '2026-11-22T15:30:00.000Z',
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-22T15:30:00.000Z'
  }
];

const report = (days: unknown[]) => ({
  tenantId,
  fromDate: '2026-11-01',
  toDate: '2026-11-22',
  revenueNetTotal: days.length === 0 ? 0 : 12345.6,
  inventoryLossTotal: days.length === 0 ? 0 : 210,
  profitAndLossTotal: days.length === 0 ? 0 : 12135.6,
  netSalesCount: days.length === 0 ? 0 : 132,
  soldItemsQuantity: days.length === 0 ? 0 : 410,
  lossEventsCount: days.length === 0 ? 0 : 3,
  lossItemsQuantity: days.length === 0 ? 0 : 12,
  days
});

const days = [
  { businessDate: '2026-11-20', revenueNetTotal: 6000, inventoryLossTotal: 110, profitAndLossTotal: 5890, netSalesCount: 70 },
  { businessDate: '2026-11-21', revenueNetTotal: 6345.6, inventoryLossTotal: 100, profitAndLossTotal: 6245.6, netSalesCount: 62 }
];

type Seed = { products?: unknown[] };

function stubHealth(healthy: boolean): void {
  cy.intercept('GET', '**/health', healthy
    ? { statusCode: 200, body: { serviceName: 'management-service', status: 'ok', timestamp: '2026-11-22T00:00:00.000Z' } }
    : { statusCode: 503, body: { message: 'down' } });
}

function visitState(route: string, theme: (typeof themes)[number], seed: Seed = {}): void {
  cy.visit(route, {
    onBeforeLoad(window) {
      window.localStorage.clear();
      window.localStorage.setItem('supermarket.theme', theme);
      window.localStorage.setItem('supermarket.locale', 'pt-BR');
      window.localStorage.setItem(`supermarket.management.recentProducts.${tenantId}`, JSON.stringify(seed.products ?? []));
    }
  });
}

describe('Management visual states', () => {
  for (const viewport of viewports) {
    for (const theme of themes) {
      describe(`${theme} ${viewport.name}`, () => {
        const shot = (state: string) => {
          if (viewport.width <= 375) {
            // The page itself must never scroll sideways on a phone; wide tables scroll inside their own region.
            cy.document().then((doc) => {
              expect(doc.documentElement.scrollWidth, `${state} scrollWidth`).to.be.at.most(doc.defaultView!.innerWidth);
            });
          }
          cy.screenshot(`${state}-${theme}-${viewport.name}`);
        };

        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
          stubHealth(true);
        });

        it('produtos-vazio', () => {
          visitState('/produtos', theme);
          cy.contains('h1', 'Produtos').should('be.visible');
          shot('produtos-vazio');
        });

        it('produtos-com-recentes', () => {
          visitState('/produtos', theme, { products: recentProducts });
          cy.contains('td', 'Café Arábica 1kg').should('be.visible');
          shot('produtos-com-recentes');
        });

        it('alterar-preco-busca', () => {
          cy.intercept('GET', '**/catalog-items/barcodes/*', {
            statusCode: 200,
            body: {
              productId,
              tenantId,
              barcode: '7891234567890',
              name: 'Café Arábica 1kg',
              unitOfMeasure: 'UN',
              unitPrice: 22.9,
              active: true,
              priceUpdatedAt: '2026-11-22T12:00:00.000Z'
            }
          });
          visitState('/produtos', theme, { products: recentProducts });
          cy.get('label').contains('Buscar pelo código de barras').parent().find('input').type('7891234567890');
          cy.contains('button', 'Buscar').click();
          cy.contains('Preço atual no caixa').should('be.visible');
          shot('alterar-preco-busca');
        });

        it('funcionarios', () => {
          cy.intercept('GET', '**/employees*', { statusCode: 200, body: employeeList(employees) });
          visitState('/funcionarios', theme);
          cy.contains('td', 'Maria Souza').should('be.visible');
          shot('funcionarios');
        });

        it('funcionarios-vazio', () => {
          cy.intercept('GET', '**/employees*', { statusCode: 200, body: employeeList([]) });
          visitState('/funcionarios', theme);
          cy.contains('Nenhum funcionário cadastrado.').should('be.visible');
          shot('funcionarios-vazio');
        });

        it('funcionarios-erro', () => {
          cy.intercept('GET', '**/employees*', { statusCode: 500, body: { message: 'boom' } });
          visitState('/funcionarios', theme);
          cy.contains('Não foi possível carregar os funcionários.').should('be.visible');
          shot('funcionarios-erro');
        });

        it('dialogo-desativar', () => {
          cy.intercept('GET', '**/employees*', { statusCode: 200, body: employeeList(employees) });
          visitState('/funcionarios', theme);
          cy.contains('button', 'Desativar').click();
          cy.get('dialog[open]').contains('Desativar funcionário').should('be.visible');
          shot('dialogo-desativar');
        });

        it('dialogo-trocar-pin', () => {
          cy.intercept('GET', '**/employees*', { statusCode: 200, body: employeeList(employees) });
          visitState('/funcionarios', theme);
          cy.contains('button', 'Trocar PIN').click();
          cy.get('dialog[open]').contains('Trocar o PIN de Maria Souza').should('be.visible');
          shot('dialogo-trocar-pin');
        });

        it('resultado', () => {
          cy.intercept('GET', '**/reports/profit-and-loss*', { statusCode: 200, body: report(days) });
          visitState('/resultado', theme);
          cy.contains('button', 'Gerar relatório').click();
          cy.contains('h2', 'Resultado de').should('be.visible');
          shot('resultado');
        });

        it('resultado-vazio', () => {
          cy.intercept('GET', '**/reports/profit-and-loss*', { statusCode: 200, body: report([]) });
          visitState('/resultado', theme);
          cy.contains('button', 'Gerar relatório').click();
          cy.contains('Nenhuma venda ou perda registrada nesse período.').should('be.visible');
          shot('resultado-vazio');
        });

        it('sem-conexao', () => {
          stubHealth(false);
          visitState('/produtos', theme);
          cy.contains('Sem conexão com o servidor da gestão').should('be.visible');
          shot('sem-conexao');
        });
      });
    }
  }
});
