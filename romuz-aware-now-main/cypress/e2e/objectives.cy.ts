/**
 * D4 Part 4: E2E Tests for Objectives Management
 */

describe('Objectives Management', () => {
  beforeEach(() => {
    cy.visit('/objectives');
  });

  it('should load objectives page', () => {
    cy.contains('Objectives').should('be.visible');
  });

  it('should display objectives list', () => {
    // Wait for data to load
    cy.get('[data-testid="objectives-list"]', { timeout: 10000 }).should('exist');
  });

  it('should open create objective dialog', () => {
    cy.contains('button', 'Create Objective').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Create New Objective').should('be.visible');
  });

  it('should create a new objective', () => {
    // Open create dialog
    cy.contains('button', 'Create Objective').click();

    // Fill form
    cy.get('input[name="code"]').type('OBJ-TEST-001');
    cy.get('input[name="title"]').type('Test Objective for E2E');
    cy.get('input[name="horizon"]').type('2024-Q4');

    // Submit form
    cy.contains('button', 'Create').click();

    // Verify success
    cy.contains('Test Objective for E2E', { timeout: 10000 }).should('be.visible');
  });

  it('should filter objectives by status', () => {
    cy.get('[data-testid="status-filter"]').click();
    cy.contains('Active').click();
    
    // Verify filtered results
    cy.get('[data-testid="objectives-list"]').should('exist');
  });

  it('should navigate to objective details', () => {
    // Click on first objective
    cy.get('[data-testid="objective-card"]').first().click();

    // Verify navigation
    cy.url().should('include', '/objectives/');
    cy.contains('KPIs').should('be.visible');
  });

  it('should edit an objective', () => {
    // Click on edit button for first objective
    cy.get('[data-testid="objective-card"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });

    // Verify edit dialog
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Edit Objective').should('be.visible');

    // Update title
    cy.get('input[name="title"]').clear().type('Updated Test Objective');

    // Submit
    cy.contains('button', 'Update').click();

    // Verify update
    cy.contains('Updated Test Objective', { timeout: 10000 }).should('be.visible');
  });

  it('should delete an objective', () => {
    // Click on delete button
    cy.get('[data-testid="objective-card"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });

    // Confirm deletion
    cy.contains('button', 'Confirm').click();

    // Verify deletion
    cy.contains('Objective deleted successfully', { timeout: 10000 }).should('be.visible');
  });
});
