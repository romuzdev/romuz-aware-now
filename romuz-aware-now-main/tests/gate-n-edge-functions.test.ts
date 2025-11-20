/**
 * Gate-N Edge Functions Tests
 * Tests HTTP behavior, auth, and payload validation for Edge Functions
 */

import { describe, it, expect, beforeAll } from 'vitest';

const EDGE_BASE = process.env.VITE_SUPABASE_URL?.replace(/\/$/, '') + '/functions/v1';
let adminToken: string;
let userToken: string;

beforeAll(async () => {
  // TODO: Obtain JWT tokens for admin and regular user
  // This would typically use a test auth helper
  adminToken = 'mock-admin-jwt';
  userToken = 'mock-user-jwt';
});

describe('gate-n-status', () => {
  const endpoint = `${EDGE_BASE}/gate-n-status`;

  it('should return 401 with no auth header', async () => {
    const response = await fetch(endpoint);
    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error_code).toBe('AUTH_REQUIRED');
  });

  it('should return 403 for non-admin role', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    expect(response.status).toBe(403);
    
    const body = await response.json();
    expect(body.error_code).toBe('PERMISSION_DENIED');
  });

  it('should return 200 with success data for admin', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty('jobs');
  });

  it('should handle CORS preflight', async () => {
    const response = await fetch(endpoint, { method: 'OPTIONS' });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('gate-n-jobs', () => {
  const endpoint = `${EDGE_BASE}/gate-n-jobs`;

  it('should return list of jobs for admin', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('should return 403 for non-admin', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    expect(response.status).toBe(403);
  });

  it('should return jobs with required fields', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const body = await response.json();
    
    if (body.data && body.data.length > 0) {
      const job = body.data[0];
      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('job_key');
      expect(job).toHaveProperty('job_type');
      expect(job).toHaveProperty('is_enabled');
    }
  });
});

describe('gate-n-trigger', () => {
  const endpoint = `${EDGE_BASE}/gate-n-trigger`;

  it('should return 400 for missing job_key', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body.error_code).toBe('INVALID_REQUEST');
  });

  it('should return 403 for non-admin', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job_key: 'test_job' })
    });
    
    expect(response.status).toBe(403);
  });

  it('should return 200 and enqueue job for admin', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job_key: 'refresh_kpis' })
    });
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data.status).toBe('queued');
  });

  it('should reject unknown job_key', async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job_key: 'nonexistent_job_12345' })
    });
    
    expect(response.status).toBe(404);
  });
});

describe('gate-n-settings', () => {
  const endpoint = `${EDGE_BASE}/gate-n-settings`;

  it('should GET settings for admin', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    // data may be null for new tenant
  });

  it('should return 403 for non-admin GET', async () => {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    expect(response.status).toBe(403);
  });

  it('should PUT and update settings for admin', async () => {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sla_config: { reminder_sla_hours: 72 },
        feature_flags: { test: true },
        limits: { max_users: 200 },
        notification_channels: { email: true }
      })
    });
    
    expect(response.status).toBe(200);
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  it('should return 403 for non-admin PUT', async () => {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sla_config: {} })
    });
    
    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON body', async () => {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: 'not-valid-json'
    });
    
    expect(response.status).toBe(400);
    
    const body = await response.json();
    expect(body.error_code).toBe('INVALID_JSON');
  });

  it('should return 405 for unsupported methods', async () => {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(405);
  });
});
