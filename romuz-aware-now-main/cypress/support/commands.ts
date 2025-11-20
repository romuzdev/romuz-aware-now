/// <reference types="cypress" />

/**
 * Custom Cypress Commands for Gate-N Testing
 */

/**
 * Login as admin user
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.log('Logging in as admin user');
  
  // استخدم session للحفاظ على تسجيل الدخول
  cy.session('admin-user', () => {
    cy.visit('/login');
    
    // ملاحظة: عدّل هذا حسب نظام تسجيل الدخول في مشروعك
    cy.get('input[type="email"]').type('admin-test@gate-n.local');
    cy.get('input[type="password"]').type('Test@123456');
    cy.get('button[type="submit"]').click();
    
    // انتظر حتى يتم تسجيل الدخول
    cy.url().should('not.include', '/login');
  });
});

/**
 * Seed Gate-N test data (اختياري)
 */
Cypress.Commands.add('seedGateNData', () => {
  cy.log('Seeding Gate-N test data');
  
  // يمكن استدعاء API endpoint لإضافة بيانات الاختبار
  // أو استخدام task في cypress.config.ts
  cy.task('seedData', { module: 'gate-n' }, { timeout: 30000 });
});

/**
 * Visit Gate-N admin console
 */
Cypress.Commands.add('visitGateN', () => {
  cy.log('Visiting Gate-N Admin Console');
  cy.visit('/admin/gate-n');
  cy.url().should('include', '/admin/gate-n');
});

// Export for TypeScript
export {};
