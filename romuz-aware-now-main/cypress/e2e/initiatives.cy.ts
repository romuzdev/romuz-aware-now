/**
 * D4 Part 4: E2E Tests for Initiatives Management
 */

describe('Initiatives Management', () => {
  beforeEach(() => {
    // Navigate to an objective details page
    cy.visit('/objectives');
    cy.get('[data-testid="objective-card"]').first().click();
  });

  it('should load objective details with Initiatives section', () => {
    cy.contains('Initiatives').should('be.visible');
    cy.get('[data-testid="initiatives-section"]').should('exist');
  });

  it('should open create initiative dialog', () => {
    cy.contains('button', 'Add Initiative').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Create New Initiative').should('be.visible');
  });

  it('should create a new initiative', () => {
    // Open create dialog
    cy.contains('button', 'Add Initiative').click();

    // Fill form
    cy.get('input[name="title"]').type('Test Initiative for E2E');
    cy.get('select[name="status"]').select('planned');
    cy.get('input[name="start_at"]').type('2024-01-01');
    cy.get('input[name="end_at"]').type('2024-12-31');

    // Submit form
    cy.contains('button', 'Create').click();

    // Verify success
    cy.contains('Test Initiative for E2E', { timeout: 10000 }).should('be.visible');
  });

  it('should update initiative status', () => {
    // Click on status dropdown for first initiative
    cy.get('[data-testid="initiative-card"]').first().within(() => {
      cy.get('[data-testid="status-select"]').click();
    });

    // Select new status
    cy.contains('In Progress').click();

    // Verify update
    cy.contains('Status updated successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should edit an initiative', () => {
    // Click on edit button for first initiative
    cy.get('[data-testid="initiative-card"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });

    // Verify edit dialog
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Edit Initiative').should('be.visible');

    // Update title
    cy.get('input[name="title"]').clear().type('Updated Test Initiative');

    // Submit
    cy.contains('button', 'Update').click();

    // Verify update
    cy.contains('Updated Test Initiative', { timeout: 10000 }).should('be.visible');
  });

  it('should delete an initiative', () => {
    // Click on delete button
    cy.get('[data-testid="initiative-card"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });

    // Confirm deletion
    cy.contains('button', 'Confirm').click();

    // Verify deletion
    cy.contains('Initiative deleted successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should filter initiatives by status', () => {
    cy.get('[data-testid="initiatives-status-filter"]').click();
    cy.contains('In Progress').click();
    
    // Verify filtered results
    cy.get('[data-testid="initiatives-section"]').should('exist');
  });
});
