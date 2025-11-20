/**
 * Centralized page selectors for E2E tests
 * 
 * Naming convention:
 * - Use data-testid attributes in production code for stable selectors
 * - Fall back to semantic selectors (button[type="submit"], etc.)
 * - Avoid brittle selectors (CSS classes, deep nesting)
 */

export const selectors = {
  // Auth pages
  auth: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '.text-destructive',
  },

  // Layout / Navigation
  layout: {
    userMenu: '[data-testid="user-menu"]',
    logoutButton: '[data-testid="logout-button"]',
    sidebarCampaigns: 'a[href="/admin/campaigns"]',
    sidebarDashboards: 'a[href="/admin/dashboards/awareness"]',
  },

  // Campaigns List Page
  campaigns: {
    newButton: 'a[href="/admin/campaigns/new"]',
    searchInput: 'input[placeholder*="Search"]',
    statusFilter: 'select[name="status"]',
    tableRow: 'table tbody tr',
    tableCell: 'table tbody td',
    checkbox: 'input[type="checkbox"]',
    bulkArchiveButton: 'button:has-text("Archive")',
    bulkDeleteButton: 'button:has-text("Delete")',
    exportButton: 'button:has-text("Export CSV")',
    saveViewButton: 'button:has-text("Save View")',
    statsCard: '[data-testid="stats-card"]',
  },

  // Campaign Detail Page
  campaignDetail: {
    backButton: 'a[href="/admin/campaigns"]',
    editButton: 'a[href*="/edit"]',
    
    // Tabs
    overviewTab: 'button[data-value="overview"]',
    contentTab: 'button[data-value="content"]',
    participantsTab: 'button[data-value="participants"]',
    metricsTab: 'button[data-value="metrics"]',
    notificationsTab: 'button[data-value="notifications"]',
    activityTab: 'button[data-value="activity"]',
    
    // Content tab
    addModuleButton: 'button:has-text("Add Module")',
    moduleRow: '[data-testid="module-row"]',
    attachQuizButton: '[data-testid="attach-quiz-button"]',
    
    // Participants tab
    importButton: 'button:has-text("Import CSV")',
    exportButton: 'button:has-text("Export CSV")',
    bulkStatusSelect: 'select[name="bulk-status"]',
    bulkScoreButton: 'button:has-text("Set Score")',
    participantRow: '[data-testid="participant-row"]',
    
    // Notifications tab
    sendNowButton: 'button:has-text("Send Now")',
    scheduleButton: 'button:has-text("Schedule")',
    templateSelect: 'select[name="template"]',
    
    // Activity tab
    auditLogEntry: '[data-testid="audit-log-entry"]',
  },

  // Campaign Form (New/Edit)
  campaignForm: {
    nameInput: 'input[name="name"]',
    descriptionInput: 'textarea[name="description"]',
    statusSelect: 'select[name="status"]',
    startDateInput: 'input[name="start_date"]',
    endDateInput: 'input[name="end_date"]',
    ownerInput: 'input[name="owner_name"]',
    submitButton: 'button[type="submit"]',
    cancelButton: 'button:has-text("Cancel")',
  },

  // Module Form Dialog
  moduleForm: {
    titleInput: 'input[name="title"]',
    typeSelect: 'select[name="type"]',
    contentTextarea: 'textarea[name="content"]',
    urlInput: 'input[name="url_or_ref"]',
    isRequiredCheckbox: 'input[name="is_required"]',
    estimatedMinutesInput: 'input[name="estimated_minutes"]',
    saveButton: 'button:has-text("Save Module")',
    cancelButton: 'button:has-text("Cancel")',
  },

  // Quiz Form Dialog
  quizForm: {
    questionInput: 'input[name="question"]',
    addQuestionButton: 'button:has-text("Add Question")',
    optionInput: 'input[name^="option"]',
    correctCheckbox: 'input[type="checkbox"][name^="correct"]',
    passScoreInput: 'input[name="pass_score"]',
    saveButton: 'button:has-text("Save Quiz")',
  },

  // Import Dialog
  importDialog: {
    fileInput: 'input[type="file"]',
    uploadButton: 'button:has-text("Upload")',
    closeButton: 'button:has-text("Close")',
    successMessage: '[data-testid="import-success"]',
    errorMessage: '[data-testid="import-error"]',
  },

  // Dashboards / Analytics
  dashboard: {
    kpiCard: '[data-testid="kpi-card"]',
    trendChart: '[data-testid="trend-chart"]',
    topCampaignsTable: '[data-testid="top-campaigns-table"]',
    filterDateRange: 'input[name="date-range"]',
    drilldownLink: 'a[data-testid="drilldown-link"]',
  },

  // Reports Dashboard (Gate-F)
  reports: {
    title: 'h1:has-text("Reports")',
    table: 'table',
    tableRow: 'table tbody tr',
    filterStartDate: 'input[type="date"][name="startDate"]',
    filterEndDate: 'input[type="date"][name="endDate"]',
    filterCampaign: 'select[name="campaign"]',
    filterIncludeTest: 'input[type="checkbox"][name="includeTest"]',
    exportCSVButton: 'button:has-text("CSV")',
    exportJSONButton: 'button:has-text("JSON")',
    exportXLSXButton: 'button:has-text("XLSX")',
    refreshButton: 'button:has-text("Refresh")',
    exportHistoryTable: '[data-testid="export-history"]',
    exportRow: '[data-testid="export-row"]',
    deleteExportButton: 'button[aria-label*="Delete"]',
    downloadLink: 'a[href*="storage"], a[download]',
    noPermissionMessage: 'text=/You don\'t have permission|no permission|403|forbidden/i',
    statsCard: '[data-testid="stats-card"]',
  },

  // Common UI elements
  common: {
    toast: '[data-testid="toast"]',
    toastSuccess: '[data-testid="toast"]:has-text("Success")',
    toastError: '[data-testid="toast"]:has-text("Error")',
    confirmDialog: '[role="alertdialog"]',
    confirmButton: 'button:has-text("Confirm")',
    cancelButton: 'button:has-text("Cancel")',
    loadingSpinner: '[data-testid="loading-spinner"]',
    disabledButton: 'button[disabled]',
    tooltip: '[role="tooltip"]',
  },
} as const;

/**
 * Helper to wait for toast and verify message
 */
export async function waitForToast(page: any, expectedText?: string) {
  const toast = page.locator(selectors.common.toast);
  await toast.waitFor({ state: 'visible', timeout: 5000 });
  
  if (expectedText) {
    await toast.filter({ hasText: expectedText }).waitFor({ state: 'visible' });
  }
  
  return toast;
}

/**
 * Helper to verify button is disabled with tooltip
 */
export async function verifyButtonDisabled(page: any, selector: string) {
  const button = page.locator(selector);
  await button.waitFor({ state: 'visible' });
  
  const isDisabled = await button.isDisabled();
  return isDisabled;
}
