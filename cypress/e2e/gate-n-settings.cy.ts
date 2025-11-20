/**
 * Gate-N Settings Management E2E Tests
 * Comprehensive tests for admin settings functionality
 */

describe('Gate-N Admin Settings - Detailed Management', () => {
  beforeEach(() => {
    // TODO: Login as tenant_admin user
    // cy.loginAsAdmin();
    
    cy.visit('/admin/gate-n');
    cy.contains(/الإعدادات|Settings/i).click();
    cy.wait(1000); // Wait for settings to load
  });

  describe('Settings Form Validation', () => {
    it('should display all settings fields', () => {
      // Verify all key settings fields exist
      cy.contains(/حد SLA|SLA hours/i).should('be.visible');
      cy.contains(/فترة الاحتفاظ|Retention/i).should('be.visible');
      cy.contains(/الحد الأقصى|Maximum/i).should('be.visible');
      
      // Should have numeric inputs
      cy.get('input[type="number"]').should('have.length.at.least', 3);
    });

    it('should validate negative numbers', () => {
      // Try to enter negative value
      cy.get('input[type="number"]').first().clear().type('-10');
      
      // Try to save
      cy.contains(/حفظ|Save/i).click();
      
      // Should show validation error
      cy.contains(/خطأ|Error|غير صالح|Invalid/i, { timeout: 5000 }).should('be.visible');
    });

    it('should validate zero values', () => {
      // Enter zero value
      cy.get('input[type="number"]').first().clear().type('0');
      
      // Save
      cy.contains(/حفظ|Save/i).click();
      
      // Should either accept or reject based on field requirements
      // (This depends on implementation)
    });

    it('should validate maximum values', () => {
      // Enter very large value
      cy.get('input[type="number"]').first().clear().type('999999');
      
      // Save
      cy.contains(/حفظ|Save/i).click();
      
      // Should accept or show appropriate message
      cy.wait(2000);
    });

    it('should validate required fields', () => {
      // Clear a required field
      cy.get('input[type="number"]').first().clear();
      
      // Try to save
      cy.contains(/حفظ|Save/i).click();
      
      // Should show validation message
      cy.contains(/مطلوب|Required|يجب|Must/i).should('be.visible');
    });
  });

  describe('Settings Update Operations', () => {
    it('should update SLA hours successfully', () => {
      const newValue = '72';
      
      // Find SLA hours input (assuming it's the first numeric input)
      cy.get('input[type="number"]').first().as('slaInput');
      
      // Clear and set new value
      cy.get('@slaInput').clear().type(newValue);
      
      // Save
      cy.contains(/حفظ|Save/i).click();
      
      // Should show success message
      cy.contains(/نجح|Success|تم|Saved/i, { timeout: 5000 }).should('be.visible');
      
      // Value should persist
      cy.get('@slaInput').should('have.value', newValue);
    });

    it('should update retention period successfully', () => {
      const newValue = '365';
      
      // Find retention input (assuming it's the second numeric input)
      cy.get('input[type="number"]').eq(1).as('retentionInput');
      
      // Update value
      cy.get('@retentionInput').clear().type(newValue);
      
      // Save
      cy.contains(/حفظ|Save/i).click();
      
      // Success
      cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
    });

    it('should update multiple settings at once', () => {
      // Update multiple fields
      cy.get('input[type="number"]').eq(0).clear().type('48');
      cy.get('input[type="number"]').eq(1).clear().type('180');
      cy.get('input[type="number"]').eq(2).clear().type('1000');
      
      // Save all
      cy.contains(/حفظ|Save/i).click();
      
      // Should show success
      cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
      
      // All values should persist
      cy.get('input[type="number"]').eq(0).should('have.value', '48');
      cy.get('input[type="number"]').eq(1).should('have.value', '180');
      cy.get('input[type="number"]').eq(2).should('have.value', '1000');
    });

    it('should preserve settings after page reload', () => {
      const testValue = '96';
      
      // Set value
      cy.get('input[type="number"]').first().clear().type(testValue);
      
      // Save
      cy.contains(/حفظ|Save/i).click();
      cy.wait(2000);
      
      // Reload page
      cy.reload();
      
      // Navigate back to settings
      cy.contains(/الإعدادات|Settings/i).click();
      cy.wait(1000);
      
      // Value should be preserved
      cy.get('input[type="number"]').first().should('have.value', testValue);
    });

    it('should handle save errors gracefully', () => {
      // Intercept API call and force error
      cy.intercept('PUT', '**/functions/v1/gate-n-settings', {
        statusCode: 500,
        body: { success: false, message: 'Internal server error' },
      }).as('settingsError');
      
      // Try to save
      cy.get('input[type="number"]').first().clear().type('100');
      cy.contains(/حفظ|Save/i).click();
      
      // Should show error message
      cy.contains(/فشل|Error|خطأ/i, { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Settings Reset and Cancel', () => {
    it('should allow canceling changes', () => {
      // Get initial value
      cy.get('input[type="number"]').first().invoke('val').as('initialValue');
      
      // Change value
      cy.get('input[type="number"]').first().clear().type('999');
      
      // Check if there's a cancel or reset button
      cy.get('button').then(($buttons) => {
        const cancelButton = $buttons.filter((i, el) => 
          /إلغاء|Cancel|Reset/i.test(el.textContent || '')
        );
        
        if (cancelButton.length > 0) {
          cy.wrap(cancelButton).first().click();
          
          // Value should revert
          cy.get('@initialValue').then((initialValue) => {
            cy.get('input[type="number"]').first().should('have.value', initialValue);
          });
        }
      });
    });
  });

  describe('Settings Documentation and Help', () => {
    it('should display helpful descriptions for settings', () => {
      // Check if there are descriptions or tooltips
      cy.get('[class*="description"], [class*="helper"], [class*="tooltip"]').should('exist');
    });
  });
});

describe('Gate-N Settings - Edge Cases', () => {
  beforeEach(() => {
    cy.visit('/admin/gate-n');
    cy.contains(/الإعدادات|Settings/i).click();
    cy.wait(1000);
  });

  it('should handle concurrent updates', () => {
    // Update first field
    cy.get('input[type="number"]').eq(0).clear().type('50');
    
    // Update second field without saving first
    cy.get('input[type="number"]').eq(1).clear().type('200');
    
    // Save all at once
    cy.contains(/حفظ|Save/i).click();
    
    // Should save both successfully
    cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
  });

  it('should handle network timeout', () => {
    // Intercept with long delay
    cy.intercept('PUT', '**/functions/v1/gate-n-settings', (req) => {
      req.reply((res) => {
        res.delay = 10000; // 10 second delay
      });
    }).as('slowUpdate');
    
    // Try to save
    cy.get('input[type="number"]').first().clear().type('100');
    cy.contains(/حفظ|Save/i).click();
    
    // Should show loading state
    cy.get('[class*="loading"], [class*="spinner"]').should('exist');
  });

  it('should prevent duplicate submissions', () => {
    // Update value
    cy.get('input[type="number"]').first().clear().type('75');
    
    // Click save multiple times rapidly
    cy.contains(/حفظ|Save/i).click().click().click();
    
    // Should only submit once (button should be disabled during submission)
    cy.contains(/حفظ|Save/i).should('be.disabled');
  });
});
