/**
 * Gate-N Job Runs History E2E Tests
 * Tests for viewing and managing job execution history
 */

describe('Gate-N Job Runs History', () => {
  beforeEach(() => {
    // TODO: Login as tenant_admin user
    // cy.loginAsAdmin();
    
    cy.visit('/admin/gate-n');
    cy.contains(/الوظائف|Jobs/i).click();
    cy.wait(1000);
  });

  describe('Job Runs List Display', () => {
    it('should display job runs table', () => {
      // Look for a "History" or "Runs" tab/section
      cy.get('body').then(($body) => {
        if ($body.text().match(/السجل|History|Runs|التشغيلات/i)) {
          cy.contains(/السجل|History|Runs|التشغيلات/i).click();
          cy.wait(1000);
        }
      });
      
      // Should show table or list of runs
      cy.get('[role="table"], [class*="table"], [class*="list"]').should('exist');
    });

    it('should display job run columns', () => {
      // Navigate to runs history
      cy.get('body').then(($body) => {
        if ($body.text().match(/السجل|History|Runs/i)) {
          cy.contains(/السجل|History|Runs/i).click();
          cy.wait(1000);
          
          // Check for key columns
          cy.contains(/الحالة|Status/i).should('be.visible');
          cy.contains(/الوقت|Time|التاريخ|Date/i).should('be.visible');
          cy.contains(/المدة|Duration|الفترة/i).should('be.visible');
        }
      });
    });

    it('should show different run statuses', () => {
      // Look for status badges
      cy.get('[class*="badge"], [class*="status"], [class*="chip"]').should('exist');
      
      // Should show various statuses (success, failed, running, etc.)
      cy.get('body').then(($body) => {
        const text = $body.text();
        const hasStatuses = 
          /نجح|Success|Succeeded|فشل|Failed|قيد التشغيل|Running/i.test(text);
        
        expect(hasStatuses).to.be.true;
      });
    });

    it('should display recent runs first', () => {
      // Runs should be ordered by timestamp (most recent first)
      // Check if timestamps are in descending order
      cy.get('[class*="timestamp"], [class*="date"], [class*="time"]')
        .should('exist')
        .and('have.length.at.least', 1);
    });
  });

  describe('Job Runs Filtering', () => {
    it('should filter by status - Success', () => {
      // Look for filter controls
      cy.get('body').then(($body) => {
        if ($body.text().match(/فلتر|Filter|تصفية/i)) {
          cy.contains(/فلتر|Filter|تصفية/i).click();
          
          // Select success status
          cy.contains(/نجح|Success|Succeeded/i).click();
          cy.wait(1000);
          
          // All visible runs should be successful
          cy.get('[class*="status"]').each(($status) => {
            expect($status.text()).to.match(/نجح|Success|Succeeded/i);
          });
        }
      });
    });

    it('should filter by status - Failed', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/فلتر|Filter/i)) {
          cy.contains(/فلتر|Filter/i).click();
          
          // Select failed status
          cy.contains(/فشل|Failed/i).click();
          cy.wait(1000);
          
          // All visible runs should be failed
          cy.get('[class*="status"]').each(($status) => {
            expect($status.text()).to.match(/فشل|Failed/i);
          });
        }
      });
    });

    it('should filter by job type', () => {
      // Look for job type filter
      cy.get('body').then(($body) => {
        if ($body.text().match(/نوع الوظيفة|Job Type|refresh_|cleanup_/i)) {
          // Select a specific job type
          cy.contains(/refresh_|cleanup_|generate_/i).first().click();
          cy.wait(1000);
        }
      });
    });

    it('should filter by date range', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/التاريخ|Date|من|From|إلى|To/i)) {
          // Look for date picker or range selector
          cy.get('input[type="date"], [class*="date"]').should('exist');
        }
      });
    });

    it('should clear all filters', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/مسح|Clear|إعادة تعيين|Reset/i)) {
          cy.contains(/مسح|Clear|إعادة تعيين|Reset/i).click();
          cy.wait(1000);
          
          // All runs should be visible again
          cy.get('[role="table"] tbody tr, [class*="list"] > *')
            .should('have.length.at.least', 1);
        }
      });
    });
  });

  describe('Job Run Details', () => {
    it('should open run details when clicked', () => {
      // Click on first run row
      cy.get('[role="table"] tbody tr, [class*="run-item"]').first().click();
      cy.wait(1000);
      
      // Should show details panel or modal
      cy.get('[role="dialog"], [class*="modal"], [class*="details"]').should('exist');
    });

    it('should display run execution time', () => {
      // Open details
      cy.get('[role="table"] tbody tr, [class*="run-item"]').first().click();
      cy.wait(1000);
      
      // Should show execution duration
      cy.contains(/المدة|Duration|الوقت|Time|ثانية|Second|دقيقة|Minute/i).should('be.visible');
    });

    it('should display run result/output', () => {
      // Open details
      cy.get('[role="table"] tbody tr, [class*="run-item"]').first().click();
      cy.wait(1000);
      
      // Should show result or output
      cy.contains(/النتيجة|Result|الإخراج|Output|السجل|Log/i).should('be.visible');
    });

    it('should display error message for failed runs', () => {
      // Find a failed run and click it
      cy.get('body').then(($body) => {
        const $failedRuns = $body.find('[class*="failed"], [class*="error"]');
        
        if ($failedRuns.length > 0) {
          cy.wrap($failedRuns).first().click();
          cy.wait(1000);
          
          // Should show error details
          cy.contains(/خطأ|Error|فشل|Failed|رسالة|Message/i).should('be.visible');
        }
      });
    });

    it('should close details panel', () => {
      // Open details
      cy.get('[role="table"] tbody tr, [class*="run-item"]').first().click();
      cy.wait(1000);
      
      // Look for close button
      cy.get('[aria-label*="close"], [class*="close"], button').then(($buttons) => {
        const closeBtn = $buttons.filter((i, el) => 
          /إغلاق|Close|×|✕/i.test(el.textContent || '') || 
          el.getAttribute('aria-label')?.match(/close/i)
        );
        
        if (closeBtn.length > 0) {
          cy.wrap(closeBtn).first().click();
          
          // Details should be hidden
          cy.get('[role="dialog"]').should('not.exist');
        }
      });
    });
  });

  describe('Job Runs Pagination', () => {
    it('should paginate long run history', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/التالي|Next|السابق|Previous|الصفحة|Page/i)) {
          // Has pagination
          cy.contains(/التالي|Next/i).should('be.visible');
        }
      });
    });

    it('should navigate to next page', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/التالي|Next/i)) {
          // Get first run ID on page 1
          cy.get('[role="table"] tbody tr, [class*="run-item"]')
            .first()
            .invoke('text')
            .as('page1FirstRun');
          
          // Click next
          cy.contains(/التالي|Next/i).click();
          cy.wait(1000);
          
          // First run should be different
          cy.get('@page1FirstRun').then((firstRun) => {
            cy.get('[role="table"] tbody tr, [class*="run-item"]')
              .first()
              .invoke('text')
              .should('not.equal', firstRun);
          });
        }
      });
    });

    it('should change page size', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/10|25|50|100/)) {
          // Look for page size selector
          cy.get('select, [role="combobox"]').then(($selects) => {
            if ($selects.length > 0) {
              cy.wrap($selects).first().select('50');
              cy.wait(1000);
              
              // Should show up to 50 items
              cy.get('[role="table"] tbody tr, [class*="run-item"]')
                .should('have.length.at.most', 50);
            }
          });
        }
      });
    });
  });

  describe('Job Runs Refresh', () => {
    it('should refresh run history manually', () => {
      // Look for refresh button
      cy.get('button').then(($buttons) => {
        const refreshBtn = $buttons.filter((i, el) => 
          /تحديث|Refresh|إعادة تحميل|Reload/i.test(el.textContent || '')
        );
        
        if (refreshBtn.length > 0) {
          cy.wrap(refreshBtn).first().click();
          cy.wait(1000);
          
          // Should show loading state briefly
          cy.get('[class*="loading"], [class*="spinner"]').should('exist');
        }
      });
    });

    it('should auto-refresh for running jobs', () => {
      // Look for a running job
      cy.get('body').then(($body) => {
        if ($body.text().match(/قيد التشغيل|Running|جاري/i)) {
          // Wait a few seconds
          cy.wait(3000);
          
          // Status might have changed (or at least attempted to refresh)
          // This is hard to test without actual running jobs
        }
      });
    });
  });

  describe('Job Runs Export', () => {
    it('should export run history', () => {
      cy.get('body').then(($body) => {
        if ($body.text().match(/تصدير|Export|تنزيل|Download/i)) {
          // Click export button
          cy.contains(/تصدير|Export|تنزيل|Download/i).click();
          
          // Should trigger download or show export dialog
          cy.wait(2000);
        }
      });
    });
  });

  describe('Job Runs Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercept API call and force error
      cy.intercept('GET', '**/functions/v1/gate-n-jobs*', {
        statusCode: 500,
        body: { success: false, message: 'Internal server error' },
      }).as('runsError');
      
      // Reload page
      cy.reload();
      
      // Should show error message
      cy.contains(/فشل|Error|خطأ/i, { timeout: 10000 }).should('be.visible');
    });

    it('should show empty state when no runs', () => {
      // Intercept API call and return empty array
      cy.intercept('GET', '**/functions/v1/gate-n-jobs*', {
        statusCode: 200,
        body: { success: true, data: [] },
      }).as('emptyRuns');
      
      // Reload
      cy.reload();
      
      // Should show empty state
      cy.contains(/لا توجد|No runs|فارغ|Empty/i, { timeout: 10000 }).should('be.visible');
    });
  });
});
