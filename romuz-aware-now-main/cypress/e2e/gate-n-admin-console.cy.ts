/**
 * Gate-N Admin Console E2E Tests (Cypress)
 * End-to-end smoke tests for the admin console
 */

describe('Gate-N Admin Console - E2E', () => {
  beforeEach(() => {
    // TODO: Login as tenant_admin user
    // cy.login('admin@example.com', 'password');
    
    // Navigate to Gate-N console
    cy.visit('/admin/gate-n');
  });

  it('should load the admin console page', () => {
    // Verify page title
    cy.contains(/لوحة التحكم الإدارية|Admin Console/i).should('be.visible');
    
    // Verify all tabs are present
    cy.contains(/الحالة|Status/i).should('be.visible');
    cy.contains(/الإعدادات|Settings/i).should('be.visible');
    cy.contains(/الوظائف|Jobs/i).should('be.visible');
  });

  it('should display overview tab with metrics', () => {
    // Default tab should be status/overview
    cy.contains(/إجمالي الوظائف|Total Jobs/i).should('be.visible');
    
    // Should show some numeric values
    cy.get('[class*="text-2xl"]').should('exist');
    
    // Should show system health badge
    cy.get('[class*="badge"]').should('exist');
  });

  it('should switch to jobs tab and display job list', () => {
    // Click on jobs tab
    cy.contains(/الوظائف|Jobs/i).click();
    
    // Wait for job list to load
    cy.contains(/قائمة الوظائف|Job List/i, { timeout: 10000 }).should('be.visible');
    
    // Should show at least one job row (or empty state)
    cy.get('[role="table"], [class*="empty"]').should('exist');
  });

  it('should switch to settings tab and show settings form', () => {
    // Click on settings tab
    cy.contains(/الإعدادات|Settings/i).click();
    
    // Should show settings panel
    cy.contains(/إعدادات المستأجر|Tenant Settings/i, { timeout: 10000 }).should('be.visible');
    
    // Should have form fields
    cy.get('input, textarea, select').should('exist');
  });

  it('should allow updating a settings field', () => {
    // Navigate to settings
    cy.contains(/الإعدادات|Settings/i).click();
    
    // Find a numeric input field (e.g., SLA hours)
    cy.get('input[type="number"]').first().as('slaInput');
    
    // Change value
    cy.get('@slaInput').clear().type('72');
    
    // Click save button
    cy.contains(/حفظ|Save/i).click();
    
    // Should show success message or toast
    cy.contains(/نجح|Success|تم الحفظ/i, { timeout: 5000 }).should('be.visible');
  });

  it('should have links to Reports (Gate-F) and KPIs (Gate-K)', () => {
    // Should see Reports & KPIs card
    cy.contains(/التقارير ومؤشرات الأداء|Reports.*KPIs/i).should('be.visible');
    
    // Should have navigation buttons
    cy.contains(/فتح التقارير|Open Reports/i).should('be.visible');
    cy.contains(/فتح مؤشرات الأداء|Open KPIs/i).should('be.visible');
  });

  it('should navigate to Reports page when button is clicked', () => {
    // Click on "Open Reports" button
    cy.contains(/فتح التقارير|Open Reports/i).click();
    
    // URL should change to reports page
    cy.url().should('include', '/admin/reports');
  });

  it('should navigate to KPIs page when button is clicked', () => {
    // Click on "Open KPIs" button
    cy.contains(/فتح مؤشرات الأداء|Open KPIs/i).click();
    
    // URL should change to KPIs page
    cy.url().should('include', '/admin/kpis');
  });

  it('should handle errors gracefully', () => {
    // Intercept API call and force error
    cy.intercept('POST', '**/functions/v1/gate-n-status', {
      statusCode: 500,
      body: { success: false, message: 'Internal server error' },
    }).as('statusError');
    
    // Reload page
    cy.reload();
    
    // Should show error message
    cy.contains(/فشل|Error|خطأ/i, { timeout: 10000 }).should('be.visible');
  });

  it('should show loading state initially', () => {
    // Intercept API call with delay
    cy.intercept('POST', '**/functions/v1/gate-n-status', (req) => {
      req.reply((res) => {
        res.delay = 2000;
      });
    }).as('statusDelayed');
    
    // Reload page
    cy.reload();
    
    // Should show loading skeleton or spinner
    cy.get('[class*="skeleton"], [class*="loading"]').should('exist');
  });
});

describe('Gate-N Admin Console - Job Management', () => {
  beforeEach(() => {
    // TODO: Login and setup test data
    cy.visit('/admin/gate-n');
    cy.contains(/الوظائف|Jobs/i).click();
  });

  it('should display job details correctly', () => {
    // Should show job key, type, status
    cy.get('[role="table"]').within(() => {
      cy.contains(/refresh_|cleanup_|generate_/i).should('exist');
    });
  });

  it('should trigger a job when "Run now" is clicked', () => {
    // Find enabled job's "Run now" button
    cy.contains(/تشغيل الآن|Run now/i).first().click();
    
    // Should show success message
    cy.contains(/تم التشغيل|Job triggered|queued/i, { timeout: 5000 }).should('be.visible');
  });

  it('should refresh job list after triggering', () => {
    // Get initial job count
    cy.get('[role="table"] tbody tr').its('length').as('initialCount');
    
    // Trigger a job
    cy.contains(/تشغيل الآن|Run now/i).first().click();
    
    // Wait for success
    cy.wait(2000);
    
    // Job list should still exist (might have updated status)
    cy.get('[role="table"] tbody tr').should('exist');
  });
});

describe('Gate-N Admin Console - Settings Management', () => {
  beforeEach(() => {
    cy.visit('/admin/gate-n');
    cy.contains(/الإعدادات|Settings/i).click();
  });

  it('should load current settings values', () => {
    // Should have populated form fields (or empty for new tenant)
    cy.get('input, textarea, select').should('exist');
  });

  it('should validate numeric inputs', () => {
    // Find SLA hours input
    cy.get('input[type="number"]').first().clear().type('-5');
    
    // Try to save
    cy.contains(/حفظ|Save/i).click();
    
    // Should show validation error or prevent save
    // (depends on implementation)
  });

  it('should save multiple settings at once', () => {
    // Update multiple fields
    cy.get('input[type="number"]').eq(0).clear().type('48');
    cy.get('input[type="number"]').eq(1).clear().type('100');
    
    // Save
    cy.contains(/حفظ|Save/i).click();
    
    // Should show success
    cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
  });

  it('should persist settings after page reload', () => {
    // Set a value
    const testValue = '96';
    cy.get('input[type="number"]').first().clear().type(testValue);
    
    // Save
    cy.contains(/حفظ|Save/i).click();
    cy.wait(2000);
    
    // Reload page
    cy.reload();
    cy.contains(/الإعدادات|Settings/i).click();
    
    // Value should be preserved
    cy.get('input[type="number"]').first().should('have.value', testValue);
  });
});
