#!/usr/bin/env tsx
/**
 * Gate-N Test Data Cleanup Runner
 * Run this script to clean up test data: npm run test:cleanup
 */

import { cleanupTestData, createTestSupabaseClient } from '../helpers/seed-test-data';

async function main() {
  console.log('🧹 Starting Gate-N test data cleanup...\n');

  try {
    const supabase = createTestSupabaseClient();
    
    console.log('📡 Connected to Supabase');
    console.log('🗑️  Cleaning up test data...\n');
    
    await cleanupTestData(supabase);
    
    console.log('\n✅ Test data cleaned up successfully!');
    console.log('=' .repeat(50));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error cleaning up test data:', error);
    process.exit(1);
  }
}

main();
