// Real local stack, no intercepts: Management verifies the manager code and PIN.
// The real PIN is read from the seed file, never hard-coded.
function pressKey(key: string): void {
  cy.get('body').trigger('keydown', { key });
}

interface SeedEmployee {
  employeeCode: string;
  pin: string;
}

const checkoutBaseUrl = (Cypress.env('checkoutBaseUrl') as string | undefined) ?? 'http://localhost:3001';

interface StoredWorkspace {
  activeSession: { sessionId: string; tenantId: string; status: string } | null;
  activeSale: { saleId: string; tenantId: string; status: string } | null;
}

describe('Cancel a paid sale with manager approval (live stack)', () => {
  // A failed run must not leave register-01 OPEN, which would break the other live specs.
  // Best effort: an OPEN sale is canceled first (no approval needed); a PAID sale cannot be undone here.
  afterEach(() => {
    cy.window({ log: false }).then((win) => {
      const raw = win.localStorage.getItem('supermarket.checkout.workspace');
      const workspace = raw === null ? null : (JSON.parse(raw) as StoredWorkspace);
      const session = workspace?.activeSession ?? null;

      if (session === null || session.status !== 'OPEN') {
        return;
      }

      if (workspace?.activeSale?.status === 'OPEN') {
        cy.request({
          method: 'POST',
          url: `${checkoutBaseUrl}/sales/${workspace.activeSale.saleId}/cancellation`,
          body: { tenantId: session.tenantId, reason: 'live spec cleanup' },
          failOnStatusCode: false
        });
      }

      cy.request({
        method: 'POST',
        url: `${checkoutBaseUrl}/pos-sessions/${session.sessionId}/closure`,
        body: { tenantId: session.tenantId, declaredCashAmount: 0 },
        failOnStatusCode: false
      });
    });
  });

  it('rejects a wrong PIN, then approves with the real manager PIN', () => {
    const seedDataPath = (Cypress.env('seedDataPath') as string | undefined) ??
      '../../../backend-services/scripts/local-stack/seed-data.json';

    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
      }
    });
    cy.contains('h1', 'Abrir caixa').should('be.visible');
    cy.get('input[inputmode="decimal"]').should('have.value', '150,00').type('{enter}');

    pressKey('F2');
    cy.get('input[inputmode="numeric"]').should('not.be.disabled');
    cy.focused().type('7891234567890{enter}');
    cy.contains('Arabica coffee beans 1kg').should('be.visible');

    pressKey('F8');
    cy.focused().should('have.attr', 'inputmode', 'decimal').type('22,90');
    pressKey('F8');
    cy.contains('h2', 'Pagamento recebido').should('be.visible');

    pressKey('F4');
    cy.get('dialog[open]').within(() => {
      cy.focused().type('teste de aprovação');
      cy.get('input[autocapitalize="characters"]').type('MANAGER-01');
      cy.get('input[type="password"]').type('0000{enter}');
      cy.contains('Código do gerente ou PIN inválido.').should('be.visible');
    });

    cy.readFile(seedDataPath).then((seed: { employees: SeedEmployee[] }) => {
      const manager = seed.employees.find((employee) => employee.employeeCode === 'MANAGER-01');
      expect(manager, 'seeded MANAGER-01').to.not.equal(undefined);
      cy.get('dialog[open]').within(() => {
        cy.get('input[type="password"]').should('have.value', '').type(`${manager?.pin ?? ''}{enter}`);
      });
    });
    cy.contains('Aprovado por Bruno Lima (MANAGER-01).').should('be.visible');

    // Close the register so the next run does not hit a stale session.
    cy.contains('button', 'Fechar caixa').click();
    cy.get('dialog[open]').within(() => {
      cy.contains('button', 'Fechar caixa').click();
    });
    cy.contains(/Caixa register-01 fechado às/).should('be.visible');
  });
});
