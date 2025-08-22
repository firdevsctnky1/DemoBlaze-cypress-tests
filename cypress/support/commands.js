/// <reference types="cypress" />

Cypress.Commands.add('safeType', (selector, value, options = {}) => {
  const val = String(value);

  cy.get(selector)
    .should('be.visible')
    .and('be.enabled')
    .scrollIntoView()
    .click({ force: true })
    .clear({ force: true })
    .type(val, { delay: 60, ...options })          // type a bit slower
    .then($el => {
      if ($el.val() !== val) {
        // 1. retry: type slower and with focus
        cy.wrap($el)
          .focus()
          .clear({ force: true })
          .type(val, { delay: 90, ...options });
      }
    })
    .then($el => {
      if ($el.val() !== val) {
        // 2. fallback
        cy.wrap($el)
          .invoke('val', val)
          .trigger('input')
          .trigger('change');
      }
    })
    .should('have.value', val); 
});
