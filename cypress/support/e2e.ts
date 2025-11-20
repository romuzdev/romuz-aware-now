// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR logs for cleaner output (optional)
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // useful for third-party script errors
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});

// Add custom commands for Gate-N testing
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Custom command to seed Gate-N test data
       * @example cy.seedGateNData()
       */
      seedGateNData(): Chainable<void>;
      
      /**
       * Custom command to navigate to Gate-N admin console
       * @example cy.visitGateN()
       */
      visitGateN(): Chainable<void>;
    }
  }
}

// Before each test
beforeEach(() => {
  // Clear cookies and local storage
  cy.clearCookies();
  cy.clearLocalStorage();
  
  // Set viewport
  cy.viewport(1280, 720);
});

// After each test
afterEach(() => {
  // Clean up if needed
});
