/**
 * ============================================================================
 * M23 - Global Test Setup
 * Purpose: Setup test environment before running tests
 * ============================================================================
 */

import { beforeAll, afterAll } from 'vitest';
import { setupTestTenants, setupTestUsers, cleanupTestData } from '../helpers/test-auth';

// Global setup - runs once before all tests
beforeAll(async () => {
  console.log('🚀 Setting up test environment...');
  
  try {
    await setupTestTenants();
    console.log('✅ Test tenants created');
    
    await setupTestUsers();
    console.log('✅ Test users created');
    
    console.log('✅ Test environment ready');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
}, 60000); // 60 second timeout

// Global teardown - runs once after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    await cleanupTestData();
    console.log('✅ Test data cleaned');
  } catch (error) {
    console.warn('⚠️ Test cleanup warning:', error);
  }
});
