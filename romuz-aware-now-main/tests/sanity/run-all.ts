/**
 * Run All Sanity Checks
 * Executes security and performance sanity checks
 */

import { runSecuritySanityChecks } from './security.sanity';
import { runPerformanceSanityChecks } from './performance.sanity';

async function runAllSanityChecks() {
  console.log('\n🔍 Running Sanity Checks for Awareness Module\n');
  console.log('═'.repeat(60));
  console.log('Environment:', process.env.E2E_SUPABASE_URL || 'Not configured');
  console.log('═'.repeat(60));

  let exitCode = 0;

  try {
    // Run security checks (blocking)
    await runSecuritySanityChecks();
  } catch (error) {
    console.error('\n❌ Security checks failed');
    exitCode = 1;
  }

  try {
    // Run performance checks (advisory)
    await runPerformanceSanityChecks();
  } catch (error) {
    console.error('\n⚠️  Performance checks encountered issues');
    // Don't fail on performance warnings
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🏁 Sanity Checks Complete');
  console.log('═'.repeat(60) + '\n');

  process.exit(exitCode);
}

runAllSanityChecks();
