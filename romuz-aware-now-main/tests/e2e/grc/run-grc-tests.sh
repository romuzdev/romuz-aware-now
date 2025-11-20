#!/bin/bash

# =====================================================
# GRC E2E Test Runner Script
# =====================================================
# Quick commands to run GRC Playwright tests
# =====================================================

set -e

echo "🎭 GRC Module E2E Test Runner"
echo "=============================="
echo ""

# Check if Playwright is installed
if ! command -v playwright &> /dev/null; then
    echo "❌ Playwright not found. Installing..."
    npx playwright install
    echo "✅ Playwright installed"
fi

# Parse arguments
TEST_TYPE=${1:-all}
TEST_MODE=${2:-headless}

case $TEST_TYPE in
  all)
    echo "🧪 Running ALL GRC tests..."
    npx playwright test --config=playwright.config.grc.ts
    ;;
    
  risks)
    echo "⚠️  Running Risks Management tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-risks
    ;;
    
  controls)
    echo "🛡️  Running Controls Management tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-controls
    ;;
    
  compliance)
    echo "✅ Running Compliance Management tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-compliance
    ;;
    
  audits)
    echo "🔍 Running Audits Management tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-audits
    ;;
    
  reports)
    echo "📊 Running Reports & Analytics tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-reports
    ;;
    
  integration)
    echo "🔗 Running Integration Workflow tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-integration
    ;;
    
  mobile)
    echo "📱 Running Mobile tests..."
    npx playwright test --config=playwright.config.grc.ts --project=grc-mobile
    ;;
    
  debug)
    echo "🐛 Running in DEBUG mode..."
    npx playwright test --config=playwright.config.grc.ts --debug
    ;;
    
  ui-mode)
    echo "🎨 Opening Playwright UI..."
    npx playwright test --config=playwright.config.grc.ts --ui
    ;;
    
  report)
    echo "📊 Opening test report..."
    npx playwright show-report test-results/grc/html
    ;;
    
  headed)
    echo "🖥️  Running in HEADED mode (visible browser)..."
    npx playwright test --config=playwright.config.grc.ts --headed
    ;;
    
  *)
    echo "❌ Unknown test type: $TEST_TYPE"
    echo ""
    echo "Usage: ./run-grc-tests.sh [type] [mode]"
    echo ""
    echo "Test Types:"
    echo "  all         - Run all GRC tests (default)"
    echo "  risks       - Run risks management tests"
    echo "  controls    - Run controls management tests"
    echo "  compliance  - Run compliance management tests"
    echo "  audits      - Run audits management tests"
    echo "  reports     - Run reports & analytics tests"
    echo "  integration - Run integration workflow tests"
    echo "  mobile      - Run mobile tests"
    echo "  debug       - Run in debug mode"
    echo "  ui-mode     - Open Playwright UI"
    echo "  report      - Open test report"
    echo "  headed      - Run with visible browser"
    echo ""
    echo "Examples:"
    echo "  ./run-grc-tests.sh all          # Run all tests"
    echo "  ./run-grc-tests.sh risks        # Run risks tests only"
    echo "  ./run-grc-tests.sh integration  # Run integration tests"
    echo "  ./run-grc-tests.sh debug        # Debug mode"
    echo "  ./run-grc-tests.sh ui-mode      # Open UI"
    echo "  ./run-grc-tests.sh report       # View report"
    echo "  ./run-grc-tests.sh headed       # Visible browser"
    exit 1
    ;;
esac

echo ""
echo "✅ Test execution completed!"
echo ""
echo "📊 View results:"
echo "   npx playwright show-report test-results/grc/html"
echo ""
echo "🔍 Debug failed tests:"
echo "   npx playwright show-trace test-results/trace.zip"
echo ""
echo "📈 Test Coverage:"
echo "   - Risks: 9 tests"
echo "   - Controls: 7 tests"
echo "   - Compliance: 8 tests"
echo "   - Audits: 8 tests"
echo "   - Reports: 9 tests"
echo "   - Integration: 2 tests"
echo "   Total: 43 tests"
