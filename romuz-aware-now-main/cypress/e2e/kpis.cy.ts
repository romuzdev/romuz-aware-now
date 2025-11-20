/**
 * D4 Part 4: E2E Tests for KPIs Management
 */

describe('KPIs Management', () => {
  beforeEach(() => {
    // Navigate to an objective details page
    cy.visit('/objectives');
    cy.get('[data-testid="objective-card"]').first().click();
  });

  it('should load objective details with KPIs section', () => {
    cy.contains('KPIs').should('be.visible');
    cy.get('[data-testid="kpis-section"]').should('exist');
  });

  it('should open create KPI dialog', () => {
    cy.contains('button', 'Add KPI').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Create New KPI').should('be.visible');
  });

  it('should create a new KPI', () => {
    // Open create dialog
    cy.contains('button', 'Add KPI').click();

    // Fill form
    cy.get('input[name="code"]').type('KPI-TEST-001');
    cy.get('input[name="title"]').type('Test KPI for E2E');
    cy.get('input[name="unit"]').type('%');
    cy.get('select[name="direction"]').select('up');

    // Submit form
    cy.contains('button', 'Create').click();

    // Verify success
    cy.contains('Test KPI for E2E', { timeout: 10000 }).should('be.visible');
  });

  it('should add a target to KPI', () => {
    // Click on first KPI
    cy.get('[data-testid="kpi-card"]').first().click();

    // Open add target dialog
    cy.contains('button', 'Add Target').click();

    // Fill form
    cy.get('input[name="period"]').type('2024-01');
    cy.get('input[name="target_value"]').type('85');

    // Submit
    cy.contains('button', 'Create').click();

    // Verify success
    cy.contains('Target added successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should add a reading to KPI', () => {
    // Click on first KPI
    cy.get('[data-testid="kpi-card"]').first().click();

    // Open add reading dialog
    cy.contains('button', 'Add Reading').click();

    // Fill form
    cy.get('input[name="period"]').type('2024-01');
    cy.get('input[name="actual_value"]').type('80');
    cy.get('select[name="source"]').select('manual');

    // Submit
    cy.contains('button', 'Create').click();

    // Verify success
    cy.contains('Reading added successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should display KPI chart', () => {
    // Click on first KPI
    cy.get('[data-testid="kpi-card"]').first().click();

    // Verify chart is visible
    cy.get('[data-testid="kpi-chart"]', { timeout: 10000 }).should('be.visible');
  });

  it('should edit a KPI', () => {
    // Click on edit button for first KPI
    cy.get('[data-testid="kpi-card"]').first().within(() => {
      cy.get('[data-testid="edit-button"]').click();
    });

    // Verify edit dialog
    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('Edit KPI').should('be.visible');

    // Update title
    cy.get('input[name="title"]').clear().type('Updated Test KPI');

    // Submit
    cy.contains('button', 'Update').click();

    // Verify update
    cy.contains('Updated Test KPI', { timeout: 10000 }).should('be.visible');
  });

  it('should delete a KPI', () => {
    // Click on delete button
    cy.get('[data-testid="kpi-card"]').first().within(() => {
      cy.get('[data-testid="delete-button"]').click();
    });

    // Confirm deletion
    cy.contains('button', 'Confirm').click();

    // Verify deletion
    cy.contains('KPI deleted successfully', { timeout: 10000 }).should('be.visible');
  });
});
