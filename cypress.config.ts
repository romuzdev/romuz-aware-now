import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    
    // Screenshots & Videos
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    video: true,
    videosFolder: 'cypress/videos',
    videoCompression: 32,
    
    // Retry configuration
    retries: {
      runMode: 2, // Retry في CI
      openMode: 0, // لا retry في الوضع التفاعلي
    },
    
    // Environment variables
    env: {
      // يمكن تعريف متغيرات هنا
      // أو استخدام cypress.env.json
    },
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Example: Log test results
      on('after:run', (results) => {
        if (results) {
          console.log('Test Results:', {
            totalTests: results.totalTests,
            totalPassed: results.totalPassed,
            totalFailed: results.totalFailed,
            totalDuration: results.totalDuration,
          });
        }
      });
      
      return config;
    },
  },
  
  // Component testing (اختياري)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});
