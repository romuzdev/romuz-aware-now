# Gate-F: Test Execution Script (PowerShell)
# Run all automated tests and generate comprehensive report

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Gate-F Test Suite..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Create reports directory
$ReportsDir = "test-reports"
if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportFile = "$ReportsDir/gatef_test_report_$Timestamp.md"

# Initialize report
@"
# Gate-F Test Execution Report
**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Environment**: $($env:NODE_ENV ?? 'development')

---

## Test Results Summary

"@ | Out-File -FilePath $ReportFile -Encoding UTF8

# Function to run tests
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$TestFile,
        [string]$TestType
    )
    
    Write-Host "Running: $TestName" -ForegroundColor Yellow
    Write-Host ""
    
    $OutputFile = "temp_output.txt"
    
    try {
        if ($TestType -eq "integration") {
            npm run test:integration $TestFile *> $OutputFile
            $TestResult = $LASTEXITCODE
        } elseif ($TestType -eq "e2e") {
            npx playwright test $TestFile *> $OutputFile
            $TestResult = $LASTEXITCODE
        }
    } catch {
        $TestResult = 1
    }
    
    if ($TestResult -eq 0) {
        Write-Host "✅ PASSED" -ForegroundColor Green
        $Status = "✅ PASSED"
    } else {
        Write-Host "❌ FAILED" -ForegroundColor Red
        $Status = "❌ FAILED"
    }
    
    $Output = Get-Content $OutputFile -Tail 50 -Raw
    
@"

### $TestName
**Status**: $Status  
**Type**: $TestType  
**File**: ``$TestFile``

``````
$Output
``````

---

"@ | Out-File -FilePath $ReportFile -Append -Encoding UTF8
    
    Remove-Item $OutputFile -ErrorAction SilentlyContinue
    Write-Host ""
    
    return $TestResult
}

# Track results
$TotalSuites = 0
$PassedSuites = 0
$FailedSuites = 0

# 1. Integration Test: API & RBAC
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 Test Suite 1: API & RBAC" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$TotalSuites++
$Result = Run-TestSuite "Reports Export API (RBAC + RLS)" "tests/reports_exports_api.test.ts" "integration"
if ($Result -eq 0) { $PassedSuites++ } else { $FailedSuites++ }

# 2. Integration Test: Format Validation
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📄 Test Suite 2: Format Validation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$TotalSuites++
$Result = Run-TestSuite "Reports Export Format (CSV/JSON)" "tests/reports_exports_format.test.ts" "integration"
if ($Result -eq 0) { $PassedSuites++ } else { $FailedSuites++ }

# 3. E2E Test: Dashboard UI
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🖥️  Test Suite 3: Dashboard UI" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
$TotalSuites++
$Result = Run-TestSuite "Reports Dashboard E2E" "tests/e2e/reports_dashboard.e2e.ts" "e2e"
if ($Result -eq 0) { $PassedSuites++ } else { $FailedSuites++ }

# Calculate success rate
$SuccessRate = [math]::Round(($PassedSuites / $TotalSuites) * 100, 1)

# Generate summary
@"

## Overall Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | $TotalSuites |
| Passed | $PassedSuites |
| Failed | $FailedSuites |
| Success Rate | $SuccessRate% |

---

## Next Steps

"@ | Out-File -FilePath $ReportFile -Append -Encoding UTF8

if ($FailedSuites -eq 0) {
@"
✅ **All tests passed!** Gate-F is ready for deployment.

Recommended actions:
1. Review manual QA checklist: ``docs/GateF_Reports_QA_Checklist_v1.md``
2. Run performance benchmarks
3. Deploy to staging environment
4. Get sign-off from Product Owner
"@ | Out-File -FilePath $ReportFile -Append -Encoding UTF8
} else {
@"
⚠️ **Some tests failed.** Review failures above and:

1. Analyze error messages
2. Check test logs in detail
3. Fix identified issues
4. Re-run failed test suites
5. Verify RLS policies and RBAC setup
"@ | Out-File -FilePath $ReportFile -Append -Encoding UTF8
}

# Console summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📈 FINAL RESULTS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Total Suites: $TotalSuites"
Write-Host "Passed: $PassedSuites" -ForegroundColor Green
Write-Host "Failed: $FailedSuites" -ForegroundColor Red
Write-Host "Success Rate: $SuccessRate%"
Write-Host ""
Write-Host "📄 Full report saved to: $ReportFile" -ForegroundColor Cyan
Write-Host ""

# Exit with error if any tests failed
if ($FailedSuites -gt 0) {
    exit 1
} else {
    exit 0
}
