#!/usr/bin/env tsx
/**
 * Gate-N Test Data Seed Runner
 * Run this script to seed test data: npm run test:seed
 */

import { seedAllGateNData, createTestSupabaseClient, verifyTestData } from '../helpers/seed-test-data';

async function main() {
  console.log('🌱 Starting Gate-N test data seeding...\n');

  try {
    const supabase = createTestSupabaseClient();
    
    console.log('📡 Connected to Supabase');
    console.log('🔄 Seeding data...\n');
    
    await seedAllGateNData(supabase);
    
    console.log('\n📊 Verifying seeded data...');
    const results = await verifyTestData(supabase);
    
    console.log('\n✅ Gate-N test data seeded successfully!');
    console.log('=' .repeat(50));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    process.exit(1);
  }
}

main();
