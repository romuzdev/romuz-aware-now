#!/bin/bash

# =====================================================
# E2E Test Runner Script
# =====================================================
# Quick commands to run Playwright tests
# =====================================================

set -e

echo "🎭 Romuz E2E Test Runner"
echo "======================="
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
    echo "🧪 Running ALL tests..."
    npx playwright test
    ;;
    
  ui)
    echo "🖥️  Running UI Flow tests (admin, manager, reader)..."
    npx playwright test admin.flow.spec.ts manager.flow.spec.ts reader.flow.spec.ts
    ;;
    
  api)
    echo "🔌 Running API tests..."
    npx playwright test api.*.spec.ts
    ;;
    
  admin)
    echo "👑 Running Admin Flow test..."
    npx playwright test admin.flow.spec.ts
    ;;
    
  manager)
    echo "📊 Running Manager Flow test..."
    npx playwright test manager.flow.spec.ts
    ;;
    
  reader)
    echo "👀 Running Reader Flow test (RBAC)..."
    npx playwright test reader.flow.spec.ts
    ;;
    
  campaigns)
    echo "📋 Running Campaigns API tests..."
    npx playwright test api.campaigns.spec.ts
    ;;
    
  participants)
    echo "👥 Running Participants API tests..."
    npx playwright test api.participants.spec.ts
    ;;
    
  views)
    echo "💾 Running Saved Views API tests..."
    npx playwright test api.savedviews.spec.ts
    ;;
    
  debug)
    echo "🐛 Running in DEBUG mode..."
    npx playwright test --debug
    ;;
    
  ui-mode)
    echo "🎨 Opening Playwright UI..."
    npx playwright test --ui
    ;;
    
  report)
    echo "📊 Opening test report..."
    npx playwright show-report test-results/html
    ;;
    
  *)
    echo "❌ Unknown test type: $TEST_TYPE"
    echo ""
    echo "Usage: ./run-tests.sh [type] [mode]"
    echo ""
    echo "Test Types:"
    echo "  all         - Run all tests (default)"
    echo "  ui          - Run UI flow tests only"
    echo "  api         - Run API tests only"
    echo "  admin       - Run admin flow"
    echo "  manager     - Run manager flow"
    echo "  reader      - Run reader flow (RBAC)"
    echo "  campaigns   - Run campaigns API tests"
    echo "  participants - Run participants API tests"
    echo "  views       - Run saved views API tests"
    echo "  debug       - Run in debug mode"
    echo "  ui-mode     - Open Playwright UI"
    echo "  report      - Open test report"
    echo ""
    echo "Examples:"
    echo "  ./run-tests.sh all          # Run all tests"
    echo "  ./run-tests.sh ui           # Run UI tests only"
    echo "  ./run-tests.sh admin        # Run admin flow"
    echo "  ./run-tests.sh debug        # Debug mode"
    echo "  ./run-tests.sh ui-mode      # Open UI"
    echo "  ./run-tests.sh report       # View report"
    exit 1
    ;;
esac

echo ""
echo "✅ Test execution completed!"
echo ""
echo "📊 View results:"
echo "   npx playwright show-report"
echo ""
echo "🔍 Debug failed tests:"
echo "   npx playwright show-trace test-results/trace.zip"
