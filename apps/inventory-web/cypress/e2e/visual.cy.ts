const themes = ['light', 'dark'] as const;
const viewports = [
  { width: 1440, height: 900 },
  { width: 375, height: 812 }
] as const;

describe('Inventory visual states', () => {
  for (const theme of themes) {
    for (const { width, height } of viewports) {
      const suffix = `${theme}-${width}`;

      function visit() {
        cy.viewport(width, height);
        cy.visit('/', {
          onBeforeLoad: (win) => {
            win.localStorage.clear();
            win.localStorage.setItem('supermarket.theme', theme);
          }
        });
      }

      it(`inicio ${suffix}`, () => {
        cy.intercept('GET', '**/health', {
          body: { serviceName: 'inventory-service', status: 'ok', timestamp: '2026-11-22T12:00:00.000Z' }
        });
        visit();
        cy.contains('Nenhuma operação de estoque disponível ainda').should('be.visible');
        cy.screenshot(`inicio-${suffix}`);
      });

      it(`sem-conexao ${suffix}`, () => {
        cy.intercept('GET', '**/health', { forceNetworkError: true });
        visit();
        cy.contains('Sem conexão com o servidor do estoque').should('be.visible');
        cy.screenshot(`sem-conexao-${suffix}`);
      });
    }
  }
});
