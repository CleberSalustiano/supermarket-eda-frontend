const themes = ['light', 'dark'] as const;
const viewports = [
  { width: 1440, height: 900 },
  { width: 375, height: 812 }
] as const;

const tenantId = '8f6d7df2-0d8a-4c81-9ad3-6f9c3c5198b1';
const saleId = 'd02f33a7-f2af-4623-a218-d1ed9dc11fd1';
const sessionId = '1c7281cc-c5ee-474a-884d-42d9b9be8293';
const storageKey = 'supermarket.checkout.workspace';

const items = [
  {
    productId: '1fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
    barcode: '7891234567890',
    name: 'Arabica coffee beans 1kg',
    unitOfMeasure: 'UN',
    unitPrice: 22.9,
    quantity: 1,
    lineTotal: 22.9
  },
  {
    productId: '2fdabff2-df1e-4b4d-86d7-0ca929e0a7b9',
    barcode: '7891000100013',
    name: 'Whole milk 1L',
    unitOfMeasure: 'UN',
    unitPrice: 4.99,
    quantity: 2,
    lineTotal: 9.98
  }
];

const openSession = {
  sessionId,
  tenantId,
  registerId: 'register-01',
  operatorId: '2b6b69a3-1c2e-442e-928a-8f0614aa7d0e',
  openingFloatAmount: 150,
  declaredCashAmount: null,
  status: 'OPEN',
  openedAt: '2026-11-22T12:00:00.000Z',
  closedAt: null,
  createdAt: '2026-11-22T12:00:00.000Z',
  updatedAt: '2026-11-22T12:00:00.000Z'
};

const closedSession = {
  ...openSession,
  status: 'CLOSED',
  declaredCashAmount: 172.9,
  closedAt: '2026-11-22T18:02:00.000Z',
  updatedAt: '2026-11-22T18:02:00.000Z'
};

const emptySale = {
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
  createdAt: '2026-11-22T12:01:00.000Z',
  updatedAt: '2026-11-22T12:01:00.000Z'
};

const saleWithItems = {
  ...emptySale,
  totalItemsQuantity: 3,
  subtotal: 32.88,
  total: 32.88,
  items
};

const paidSale = {
  ...saleWithItems,
  status: 'PAID',
  paymentMethod: 'CASH',
  paidAmount: 50,
  changeAmount: 17.12,
  paidAt: '2026-11-22T12:03:00.000Z'
};

const completedSale = {
  ...paidSale,
  status: 'COMPLETED',
  completedAt: '2026-11-22T12:04:00.000Z'
};

function seed(win: Cypress.AUTWindow, session: unknown, sale: unknown): void {
  win.localStorage.setItem(storageKey, JSON.stringify({ activeSession: session, activeSale: sale }));
}

function openMoreActionsIfCompact(width: number, label: string): void {
  if (width < 640) {
    cy.get('button[aria-label="Mais ações"]').click();
  }

  cy.contains('button', label).click();
}

describe('Checkout visual states', () => {
  for (const theme of themes) {
    for (const { width, height } of viewports) {
      const suffix = `${theme}-${width}`;

      function visit(session: unknown = null, sale: unknown = null, health: 'ok' | 'down' = 'ok') {
        cy.viewport(width, height);
        if (health === 'ok') {
          cy.intercept('GET', '**/health', {
            body: { serviceName: 'checkout-service', status: 'ok', timestamp: '2026-11-22T12:00:00.000Z' }
          });
        } else {
          cy.intercept('GET', '**/health', { forceNetworkError: true });
        }
        cy.visit('/', {
          onBeforeLoad: (win) => {
            win.localStorage.clear();
            win.localStorage.setItem('supermarket.theme', theme);
            if (session !== null) {
              seed(win, session, sale);
            }
          }
        });
      }

      it(`abrir-caixa ${suffix}`, () => {
        visit();
        cy.contains('h1', 'Abrir caixa').should('be.visible');
        cy.screenshot(`abrir-caixa-${suffix}`);
      });

      it(`venda-vazia ${suffix}`, () => {
        visit(openSession, emptySale);
        cy.contains('Registre o primeiro item pelo código de barras.').should('be.visible');
        cy.screenshot(`venda-vazia-${suffix}`);
      });

      it(`venda-com-itens ${suffix}`, () => {
        visit(openSession, saleWithItems);
        cy.contains('Whole milk 1L').should('be.visible');
        cy.screenshot(`venda-com-itens-${suffix}`);
      });

      it(`pagamento-dinheiro ${suffix}`, () => {
        visit(openSession, saleWithItems);
        cy.get('form#payment-form input[inputmode="decimal"]').type('50,00');
        cy.contains('Troco').should('be.visible');
        cy.screenshot(`pagamento-dinheiro-${suffix}`);
      });

      it(`pago ${suffix}`, () => {
        visit(openSession, paidSale);
        cy.contains('h2', 'Pagamento recebido').should('be.visible');
        cy.screenshot(`pago-${suffix}`);
      });

      it(`cupom ${suffix}`, () => {
        visit(openSession, completedSale);
        cy.contains('Venda concluída às').should('be.visible');
        cy.screenshot(`cupom-${suffix}`);
      });

      it(`dialogo-cancelar ${suffix}`, () => {
        visit(openSession, paidSale);
        cy.get('body').trigger('keydown', { key: 'F4' });
        cy.get('dialog[open]').should('be.visible');
        cy.screenshot(`dialogo-cancelar-${suffix}`);
      });

      function failApprovalAndCapture(statusCode: number, code: string, message: string, name: string) {
        cy.intercept('POST', '**/sales/*/cancellation', {
          statusCode,
          body: {
            statusCode,
            message: 'Backend detail',
            code,
            path: `/sales/${saleId}/cancellation`,
            correlationId: 'corr-approval',
            timestamp: '2026-11-22T12:05:00.000Z'
          }
        });
        visit(openSession, paidSale);
        cy.get('body').trigger('keydown', { key: 'F4' });
        cy.get('dialog[open]').within(() => {
          cy.focused().type('Forma de pagamento errada');
          cy.get('input[autocapitalize="characters"]').type('MANAGER-01');
          cy.get('input[type="password"]').type('2468{enter}');
          cy.contains(message).should('be.visible');
        });
        cy.screenshot(`${name}-${suffix}`);
      }

      it(`dialogo-cancelar-recusado ${suffix}`, () => {
        failApprovalAndCapture(403, 'AUTHORIZATION_DENIED', 'Código do gerente ou PIN inválido.', 'dialogo-cancelar-recusado');
      });

      it(`dialogo-cancelar-gestao-indisponivel ${suffix}`, () => {
        failApprovalAndCapture(
          503,
          'DEPENDENCY_UNAVAILABLE',
          'Gestão indisponível, tente novamente. A venda não foi cancelada.',
          'dialogo-cancelar-gestao-indisponivel'
        );
      });

      it(`dialogo-fechar ${suffix}`, () => {
        visit(openSession, completedSale);
        openMoreActionsIfCompact(width, 'Fechar caixa');
        cy.get('dialog[open]').should('be.visible');
        cy.screenshot(`dialogo-fechar-${suffix}`);
      });

      it(`caixa-fechado ${suffix}`, () => {
        visit(closedSession, null);
        cy.contains(/Caixa register-01 fechado às/).should('be.visible');
        cy.screenshot(`caixa-fechado-${suffix}`);
      });

      it(`erro-produto-nao-encontrado ${suffix}`, () => {
        cy.intercept('GET', '**/catalog-items/barcodes/*', {
          statusCode: 404,
          body: { statusCode: 404, message: 'Not found', path: '/catalog-items/barcodes/0000', timestamp: '2026-11-22T12:00:00.000Z' }
        });
        visit(openSession, emptySale);
        cy.get('input[inputmode="numeric"]').type('7890000000000');
        cy.contains('button', 'Consultar preço').click();
        cy.contains('Produto não encontrado: 7890000000000').should('be.visible');
        cy.screenshot(`erro-produto-nao-encontrado-${suffix}`);
      });

      it(`sem-conexao ${suffix}`, () => {
        visit(openSession, saleWithItems, 'down');
        cy.contains('Sem conexão com o servidor do caixa').should('be.visible');
        cy.screenshot(`sem-conexao-${suffix}`);
      });
    }
  }
});
