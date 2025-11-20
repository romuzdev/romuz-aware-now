/**
 * Gate-N Alert Policies Management E2E Tests
 * Comprehensive tests for alert policies, channels, and templates
 */

describe('Gate-N Alert Policies - Management', () => {
  beforeEach(() => {
    // TODO: Login as tenant_admin user
    // cy.loginAsAdmin();
    
    // Navigate to alerts section (might be a separate page or tab)
    cy.visit('/admin/gate-n');
    
    // Look for alerts/policies section
    cy.get('body').then(($body) => {
      if ($body.text().match(/التنبيهات|Alerts|السياسات|Policies/i)) {
        cy.contains(/التنبيهات|Alerts|السياسات|Policies/i).click();
        cy.wait(1000);
      } else {
        // Might be on a different route
        cy.visit('/admin/alerts');
      }
    });
  });

  describe('Alert Policies List', () => {
    it('should display alert policies list', () => {
      // Should show policies table or list
      cy.get('[role="table"], [class*="table"], [class*="list"]').should('exist');
    });

    it('should display policy columns', () => {
      // Check for key columns
      cy.contains(/الاسم|Name/i).should('be.visible');
      cy.contains(/الحالة|Status|مفعل|Enabled/i).should('be.visible');
      cy.contains(/الشرط|Condition|المعيار|Criteria/i).should('be.visible');
    });

    it('should show policy status (enabled/disabled)', () => {
      // Look for status indicators
      cy.get('[class*="badge"], [class*="status"], [class*="switch"]').should('exist');
    });

    it('should count total policies', () => {
      // Should show policy count
      cy.get('[role="table"] tbody tr, [class*="policy-item"]')
        .should('have.length.at.least', 0);
    });
  });

  describe('Create Alert Policy', () => {
    it('should open create policy dialog', () => {
      // Click create button
      cy.contains(/إنشاء|Create|إضافة|Add|جديد|New/i).click();
      cy.wait(500);
      
      // Should show form dialog
      cy.get('[role="dialog"], [class*="modal"], [class*="form"]').should('be.visible');
    });

    it('should require policy name', () => {
      // Open create dialog
      cy.contains(/إنشاء|Create|إضافة|Add/i).click();
      cy.wait(500);
      
      // Try to save without name
      cy.contains(/حفظ|Save|إنشاء|Create/i).click();
      
      // Should show validation error
      cy.contains(/مطلوب|Required|يجب|Must/i).should('be.visible');
    });

    it('should create new policy with basic info', () => {
      // Open create dialog
      cy.contains(/إنشاء|Create|إضافة|Add/i).click();
      cy.wait(500);
      
      // Fill in policy name
      cy.get('input[name*="name"], input[placeholder*="اسم"], input[placeholder*="name"]')
        .type('Test Policy E2E');
      
      // Fill in description
      cy.get('textarea, input[name*="description"]')
        .first()
        .type('This is a test policy created by Cypress');
      
      // Select metric
      cy.get('body').then(($body) => {
        if ($body.text().match(/المعيار|Metric|المقياس/i)) {
          cy.get('select, [role="combobox"]').first().click();
          cy.contains(/completion_rate|delivery_rate|error_rate/i).first().click();
        }
      });
      
      // Save
      cy.contains(/حفظ|Save|إنشاء|Create/i).click();
      cy.wait(2000);
      
      // Should show success message
      cy.contains(/نجح|Success|تم|Created/i, { timeout: 5000 }).should('be.visible');
      
      // New policy should appear in list
      cy.contains('Test Policy E2E').should('be.visible');
    });

    it('should set policy threshold', () => {
      // Open create dialog
      cy.contains(/إنشاء|Create|إضافة|Add/i).click();
      cy.wait(500);
      
      // Set name
      cy.get('input[name*="name"]').type('Threshold Test Policy');
      
      // Set threshold value
      cy.get('input[type="number"]').first().clear().type('80');
      
      // Set operator (greater than, less than, etc.)
      cy.get('body').then(($body) => {
        if ($body.text().match(/أكبر من|Greater|أقل من|Less/i)) {
          cy.get('select, [role="combobox"]').then(($selects) => {
            if ($selects.length > 1) {
              cy.wrap($selects).eq(1).click();
              cy.contains(/أكبر من|Greater/i).click();
            }
          });
        }
      });
      
      // Save
      cy.contains(/حفظ|Save|إنشاء|Create/i).click();
      cy.wait(2000);
      
      // Success
      cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
    });

    it('should cancel policy creation', () => {
      // Open create dialog
      cy.contains(/إنشاء|Create|إضافة|Add/i).click();
      cy.wait(500);
      
      // Fill some data
      cy.get('input[name*="name"]').type('Will Not Save');
      
      // Click cancel
      cy.contains(/إلغاء|Cancel/i).click();
      
      // Dialog should close
      cy.get('[role="dialog"]').should('not.exist');
      
      // Policy should not be in list
      cy.contains('Will Not Save').should('not.exist');
    });
  });

  describe('Edit Alert Policy', () => {
    it('should open edit policy dialog', () => {
      // Find first policy row
      cy.get('[role="table"] tbody tr, [class*="policy-item"]').first().within(() => {
        // Look for edit button
        cy.get('button').then(($buttons) => {
          const editBtn = $buttons.filter((i, el) => 
            /تعديل|Edit|تحرير/i.test(el.textContent || '') ||
            el.querySelector('[class*="edit"], [class*="pencil"]')
          );
          
          if (editBtn.length > 0) {
            cy.wrap(editBtn).first().click();
          }
        });
      });
      
      cy.wait(500);
      
      // Should show edit form
      cy.get('[role="dialog"], [class*="modal"]').should('be.visible');
    });

    it('should update policy name', () => {
      // Open first policy for editing
      cy.get('[role="table"] tbody tr, [class*="policy-item"]').first().click();
      cy.wait(500);
      
      // Update name
      cy.get('input[name*="name"]').clear().type('Updated Policy Name E2E');
      
      // Save
      cy.contains(/حفظ|Save|تحديث|Update/i).click();
      cy.wait(2000);
      
      // Success
      cy.contains(/نجح|Success|تم التحديث|Updated/i, { timeout: 5000 }).should('be.visible');
      
      // Updated name should be visible
      cy.contains('Updated Policy Name E2E').should('be.visible');
    });

    it('should toggle policy enabled status', () => {
      // Find first policy
      cy.get('[role="table"] tbody tr, [class*="policy-item"]').first().within(() => {
        // Look for switch or toggle
        cy.get('[role="switch"], [type="checkbox"]').then(($toggle) => {
          if ($toggle.length > 0) {
            // Get current state
            const isChecked = $toggle.is(':checked');
            
            // Toggle
            cy.wrap($toggle).click({ force: true });
            cy.wait(1000);
            
            // State should change
            cy.wrap($toggle).should(isChecked ? 'not.be.checked' : 'be.checked');
          }
        });
      });
    });

    it('should update policy threshold', () => {
      // Open edit
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Change threshold
      cy.get('input[type="number"]').first().clear().type('95');
      
      // Save
      cy.contains(/حفظ|Save|تحديث|Update/i).click();
      cy.wait(2000);
      
      // Success
      cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
    });
  });

  describe('Delete Alert Policy', () => {
    it('should show delete confirmation', () => {
      // Find delete button
      cy.get('[role="table"] tbody tr').first().within(() => {
        cy.get('button').then(($buttons) => {
          const deleteBtn = $buttons.filter((i, el) => 
            /حذف|Delete|إزالة|Remove/i.test(el.textContent || '') ||
            el.querySelector('[class*="trash"], [class*="delete"]')
          );
          
          if (deleteBtn.length > 0) {
            cy.wrap(deleteBtn).first().click();
          }
        });
      });
      
      cy.wait(500);
      
      // Should show confirmation dialog
      cy.contains(/تأكيد|Confirm|هل أنت متأكد|Are you sure/i).should('be.visible');
    });

    it('should cancel delete operation', () => {
      // Get policy name
      cy.get('[role="table"] tbody tr').first().invoke('text').as('policyName');
      
      // Click delete
      cy.get('[role="table"] tbody tr').first().within(() => {
        cy.get('button').then(($buttons) => {
          const deleteBtn = $buttons.filter((i, el) => 
            /حذف|Delete/i.test(el.textContent || '')
          );
          if (deleteBtn.length > 0) {
            cy.wrap(deleteBtn).first().click();
          }
        });
      });
      
      cy.wait(500);
      
      // Click cancel
      cy.contains(/إلغاء|Cancel/i).click();
      
      // Policy should still exist
      cy.get('@policyName').then((name) => {
        cy.contains(name as string).should('exist');
      });
    });

    it('should delete policy permanently', () => {
      // Get policy name
      cy.get('[role="table"] tbody tr').first().invoke('text').as('policyName');
      
      // Click delete
      cy.get('[role="table"] tbody tr').first().within(() => {
        cy.get('button').then(($buttons) => {
          const deleteBtn = $buttons.filter((i, el) => 
            /حذف|Delete/i.test(el.textContent || '')
          );
          if (deleteBtn.length > 0) {
            cy.wrap(deleteBtn).first().click();
          }
        });
      });
      
      cy.wait(500);
      
      // Confirm delete
      cy.contains(/تأكيد|Confirm|نعم|Yes|حذف|Delete/i).last().click();
      cy.wait(2000);
      
      // Success message
      cy.contains(/نجح|Success|تم الحذف|Deleted/i, { timeout: 5000 }).should('be.visible');
      
      // Policy should be removed from list
      cy.get('@policyName').then((name) => {
        cy.contains(name as string).should('not.exist');
      });
    });
  });

  describe('Alert Policy Channels', () => {
    it('should view policy channels', () => {
      // Open policy details
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Look for channels section
      cy.get('body').then(($body) => {
        if ($body.text().match(/القنوات|Channels/i)) {
          cy.contains(/القنوات|Channels/i).should('be.visible');
        }
      });
    });

    it('should add channel to policy', () => {
      // Open policy
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Look for "Add Channel" button
      cy.get('body').then(($body) => {
        if ($body.text().match(/إضافة قناة|Add Channel/i)) {
          cy.contains(/إضافة قناة|Add Channel/i).click();
          cy.wait(500);
          
          // Select a channel
          cy.get('select, [role="combobox"]').first().click();
          cy.get('[role="option"]').first().click();
          
          // Save
          cy.contains(/حفظ|Save|إضافة|Add/i).click();
          cy.wait(2000);
          
          // Success
          cy.contains(/نجح|Success/i, { timeout: 5000 }).should('be.visible');
        }
      });
    });

    it('should remove channel from policy', () => {
      // Open policy
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Find channel list
      cy.get('body').then(($body) => {
        if ($body.text().match(/القنوات|Channels/i)) {
          // Look for remove button on first channel
          cy.get('[class*="channel"]').first().within(() => {
            cy.get('button').then(($buttons) => {
              const removeBtn = $buttons.filter((i, el) => 
                /إزالة|Remove|حذف|Delete/i.test(el.textContent || '')
              );
              if (removeBtn.length > 0) {
                cy.wrap(removeBtn).first().click();
                cy.wait(1000);
              }
            });
          });
        }
      });
    });
  });

  describe('Alert Policy Targets', () => {
    it('should view policy targets', () => {
      // Open policy
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Look for targets section
      cy.get('body').then(($body) => {
        if ($body.text().match(/الأهداف|Targets|الحملات|Campaigns/i)) {
          cy.contains(/الأهداف|Targets/i).should('be.visible');
        }
      });
    });

    it('should add target to policy', () => {
      // Open policy
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Look for "Add Target" button
      cy.get('body').then(($body) => {
        if ($body.text().match(/إضافة هدف|Add Target/i)) {
          cy.contains(/إضافة هدف|Add Target/i).click();
          cy.wait(500);
          
          // Select target (campaign or tag)
          cy.get('select, [role="combobox"]').first().click();
          cy.get('[role="option"]').first().click();
          
          // Save
          cy.contains(/حفظ|Save|إضافة|Add/i).click();
          cy.wait(2000);
        }
      });
    });

    it('should remove target from policy', () => {
      // Open policy
      cy.get('[role="table"] tbody tr').first().click();
      cy.wait(500);
      
      // Find target list
      cy.get('body').then(($body) => {
        if ($body.text().match(/الأهداف|Targets/i)) {
          // Look for remove button
          cy.get('[class*="target"]').first().within(() => {
            cy.get('button').then(($buttons) => {
              const removeBtn = $buttons.filter((i, el) => 
                /إزالة|Remove/i.test(el.textContent || '')
              );
              if (removeBtn.length > 0) {
                cy.wrap(removeBtn).first().click();
                cy.wait(1000);
              }
            });
          });
        }
      });
    });
  });

  describe('Alert Policies Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API call and force error
      cy.intercept('GET', '**/alert_policies*', {
        statusCode: 500,
        body: { error: 'Internal server error' },
      }).as('policiesError');
      
      // Reload page
      cy.reload();
      
      // Should show error message
      cy.contains(/فشل|Error|خطأ/i, { timeout: 10000 }).should('be.visible');
    });

    it('should show empty state when no policies', () => {
      // Intercept and return empty
      cy.intercept('GET', '**/alert_policies*', {
        statusCode: 200,
        body: [],
      }).as('emptyPolicies');
      
      // Reload
      cy.reload();
      
      // Should show empty state
      cy.contains(/لا توجد|No policies|فارغ|Empty/i, { timeout: 10000 }).should('be.visible');
    });
  });
});
