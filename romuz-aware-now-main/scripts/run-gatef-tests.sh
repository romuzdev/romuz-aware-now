#!/bin/bash
# Gate-F: Test Execution Script
# Run all automated tests and generate comprehensive report

set -e

echo "🚀 Starting Gate-F Test Suite..."
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create reports directory
mkdir -p test-reports
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="test-reports/gatef_test_report_${TIMESTAMP}.md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Gate-F Test Execution Report
**Generated**: $(date '+%Y-%m-%d %H:%M:%S')
**Environment**: ${NODE_ENV:-development}

---

## Test Results Summary

EOF

# Function to run tests and capture results
run_test_suite() {
    local test_name=$1
    local test_file=$2
    local test_type=$3
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo ""
    
    # Run test and capture output
    if [ "$test_type" == "integration" ]; then
        npm run test:integration "$test_file" > temp_output.txt 2>&1 && TEST_RESULT=0 || TEST_RESULT=$?
    elif [ "$test_type" == "e2e" ]; then
        npx playwright test "$test_file" > temp_output.txt 2>&1 && TEST_RESULT=0 || TEST_RESULT=$?
    fi
    
    # Parse results
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        STATUS="✅ PASSED"
    else
        echo -e "${RED}❌ FAILED${NC}"
        STATUS="❌ FAILED"
    fi
    
    # Append to report
    cat >> "$REPORT_FILE" << EOF

### $test_name
**Status**: $STATUS  
**Type**: $test_type  
**File**: \`$test_file\`

\`\`\`
$(cat temp_output.txt | tail -n 50)
\`\`\`

---

EOF
    
    rm temp_output.txt
    echo ""
}

# Track overall results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# 1. Integration Test: API & RBAC
echo "================================"
echo "📊 Test Suite 1: API & RBAC"
echo "================================"
TOTAL_SUITES=$((TOTAL_SUITES + 1))
run_test_suite "Reports Export API (RBAC + RLS)" "tests/reports_exports_api.test.ts" "integration"
if [ $TEST_RESULT -eq 0 ]; then PASSED_SUITES=$((PASSED_SUITES + 1)); else FAILED_SUITES=$((FAILED_SUITES + 1)); fi

# 2. Integration Test: Format Validation
echo "================================"
echo "📄 Test Suite 2: Format Validation"
echo "================================"
TOTAL_SUITES=$((TOTAL_SUITES + 1))
run_test_suite "Reports Export Format (CSV/JSON)" "tests/reports_exports_format.test.ts" "integration"
if [ $TEST_RESULT -eq 0 ]; then PASSED_SUITES=$((PASSED_SUITES + 1)); else FAILED_SUITES=$((FAILED_SUITES + 1)); fi

# 3. E2E Test: Dashboard UI
echo "================================"
echo "🖥️  Test Suite 3: Dashboard UI"
echo "================================"
TOTAL_SUITES=$((TOTAL_SUITES + 1))
run_test_suite "Reports Dashboard E2E" "tests/e2e/reports_dashboard.e2e.ts" "e2e"
if [ $TEST_RESULT -eq 0 ]; then PASSED_SUITES=$((PASSED_SUITES + 1)); else FAILED_SUITES=$((FAILED_SUITES + 1)); fi

# Generate summary
cat >> "$REPORT_FILE" << EOF

## Overall Summary

| Metric | Value |
|--------|-------|
| Total Test Suites | $TOTAL_SUITES |
| Passed | $PASSED_SUITES |
| Failed | $FAILED_SUITES |
| Success Rate | $(awk "BEGIN {printf \"%.1f\", ($PASSED_SUITES/$TOTAL_SUITES)*100}")% |

---

## Next Steps

EOF

if [ $FAILED_SUITES -eq 0 ]; then
    cat >> "$REPORT_FILE" << EOF
✅ **All tests passed!** Gate-F is ready for deployment.

Recommended actions:
1. Review manual QA checklist: \`docs/GateF_Reports_QA_Checklist_v1.md\`
2. Run performance benchmarks
3. Deploy to staging environment
4. Get sign-off from Product Owner
EOF
else
    cat >> "$REPORT_FILE" << EOF
⚠️ **Some tests failed.** Review failures above and:

1. Analyze error messages
2. Check test logs in detail
3. Fix identified issues
4. Re-run failed test suites
5. Verify RLS policies and RBAC setup
EOF
fi

# Console summary
echo ""
echo "================================"
echo "📈 FINAL RESULTS"
echo "================================"
echo -e "Total Suites: $TOTAL_SUITES"
echo -e "${GREEN}Passed: $PASSED_SUITES${NC}"
echo -e "${RED}Failed: $FAILED_SUITES${NC}"
echo -e "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED_SUITES/$TOTAL_SUITES)*100}")%"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""

# Exit with error if any tests failed
if [ $FAILED_SUITES -gt 0 ]; then
    exit 1
else
    exit 0
fi
