// Load custom commands
require('./commands');

// Don't fail tests on the app's uncaught exceptions
Cypress.on('uncaught:exception', () => false);

// Per-test setup
beforeEach(function () {
  // Demoblaze HLS video requests that often 403 (keeps logs clean)
  cy.intercept('GET', 'https://hls.demoblaze.com/**', {
    statusCode: 204,
    body: '',
  }).as('hls');

  // start log
  cy.log(`Starting: ${this.currentTest.title}`);
});

// Per-test teardown
afterEach(function () {
  cy.log(`Finished: ${this.currentTest.title} — ${this.currentTest.state}`);
});
