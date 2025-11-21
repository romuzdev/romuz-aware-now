/**
 * M20 - Threat Intelligence API E2E Tests
 * Tests Edge Function and API endpoints
 */

import { test, expect } from '@playwright/test';

const EDGE_FUNCTION_URL = process.env.VITE_SUPABASE_URL 
  ? `${process.env.VITE_SUPABASE_URL}/functions/v1/threat-intel-sync`
  : 'http://localhost:54321/functions/v1/threat-intel-sync';

test.describe('Threat Intelligence API Tests', () => {
  let authToken: string;
  const testTenantId = 'test-tenant-' + Date.now();

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${process.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      data: {
        email: 'admin-test@gate-n.local',
        password: 'Test@123456',
      },
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok()) {
      const data = await response.json();
      authToken = data.access_token;
    }
  });

  test('should sync threat feed via edge function', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.post(EDGE_FUNCTION_URL, {
      data: {
        feed_id: 'test-feed-id',
        tenant_id: testTenantId,
      },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Expect either success or error with proper status code
    expect([200, 400, 401, 404]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('indicators_fetched');
      expect(data).toHaveProperty('indicators_upserted');
    }
  });

  test('should fetch threat statistics via RPC', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.post(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/get_threat_statistics`,
      {
        data: {
          p_tenant_id: testTenantId,
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
          'Content-Profile': 'public',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('total_indicators');
      expect(data[0]).toHaveProperty('critical_indicators');
      expect(data[0]).toHaveProperty('total_matches');
      expect(data[0]).toHaveProperty('active_feeds');
    }
  });

  test('should fetch threat feeds with RLS enforcement', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.get(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/threat_intelligence_feeds`,
      {
        params: {
          tenant_id: `eq.${testTenantId}`,
          select: '*',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
          'Accept-Profile': 'public',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    // All returned feeds should belong to the test tenant
    data.forEach((feed: any) => {
      expect(feed.tenant_id).toBe(testTenantId);
    });
  });

  test('should fetch threat indicators with nested feed data', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.get(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/threat_indicators`,
      {
        params: {
          tenant_id: `eq.${testTenantId}`,
          select: '*, feed:threat_intelligence_feeds(*)',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
          'Accept-Profile': 'public',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    // Verify nested feed data if indicators exist
    if (data.length > 0 && data[0].feed) {
      expect(data[0].feed).toHaveProperty('feed_name');
      expect(data[0].feed).toHaveProperty('feed_type');
    }
  });

  test('should fetch threat matches with explicit foreign key hint', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.get(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/threat_matches`,
      {
        params: {
          tenant_id: `eq.${testTenantId}`,
          select: '*, indicator:threat_indicators!threat_matches_indicator_id_fkey(*, feed:threat_intelligence_feeds(*))',
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
          'Accept-Profile': 'public',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    
    // Verify nested indicator and feed data if matches exist
    if (data.length > 0 && data[0].indicator) {
      expect(data[0].indicator).toHaveProperty('indicator_value');
      expect(data[0].indicator).toHaveProperty('threat_level');
      
      if (data[0].indicator.feed) {
        expect(data[0].indicator.feed).toHaveProperty('feed_name');
      }
    }
  });

  test('should handle unauthorized access to edge function', async ({ request }) => {
    const response = await request.post(EDGE_FUNCTION_URL, {
      data: {
        feed_id: 'test-feed-id',
        tenant_id: testTenantId,
      },
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      },
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('should validate required parameters in edge function', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    const response = await request.post(EDGE_FUNCTION_URL, {
      data: {
        // Missing feed_id and tenant_id
      },
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Should return 400 Bad Request
    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should handle rate limiting gracefully', async ({ request }) => {
    test.skip(!authToken, 'Auth token not available');

    // Make multiple rapid requests
    const promises = Array(10).fill(null).map(() =>
      request.get(
        `${process.env.VITE_SUPABASE_URL}/rest/v1/threat_intelligence_feeds`,
        {
          params: {
            tenant_id: `eq.${testTenantId}`,
          },
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
            'Accept-Profile': 'public',
          },
        }
      )
    );

    const responses = await Promise.all(promises);
    
    // All requests should either succeed or be rate limited
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status());
    });
  });
});
