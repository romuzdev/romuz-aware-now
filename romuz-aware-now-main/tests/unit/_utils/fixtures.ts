/**
 * Test Fixtures & Helpers
 * Fixed date/time and common assertions for unit tests
 */

/**
 * Fixed "now" timestamp for deterministic date tests
 * 2024-06-15 14:30:00 UTC
 */
export const FIXED_NOW = new Date('2024-06-15T14:30:00.000Z');

/**
 * Mock Date.now() and new Date() to return fixed timestamp
 */
export function mockFixedDate() {
  const originalDate = global.Date;
  const originalNow = Date.now;

  // @ts-ignore
  global.Date = class extends originalDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(FIXED_NOW);
      } else {
        super(...args);
      }
    }

    static now() {
      return FIXED_NOW.getTime();
    }
  } as DateConstructor;

  Date.now = () => FIXED_NOW.getTime();

  return () => {
    global.Date = originalDate;
    Date.now = originalNow;
  };
}

/**
 * Assert immutability - object should not be mutated
 */
export function assertImmutable<T extends Record<string, any>>(
  original: T,
  snapshot: T
) {
  expect(original).toEqual(snapshot);
}

/**
 * Common test filters for campaigns
 */
export const TEST_CAMPAIGN_FILTERS = {
  empty: {
    q: '',
    status: 'all',
    from: null,
    to: null,
    owner: '',
    includeArchived: false,
    pageSize: 10,
    sortBy: 'start_date',
    sortDir: 'desc' as const,
  },
  withValues: {
    q: 'Security',
    status: 'active',
    from: '2024-01-01',
    to: '2024-12-31',
    owner: 'admin@test.com',
    includeArchived: true,
    pageSize: 25,
    sortBy: 'name',
    sortDir: 'asc' as const,
  },
};

/**
 * Common test filters for participants
 */
export const TEST_PARTICIPANT_FILTERS = {
  empty: {
    q: '',
    status: 'all' as const,
    scoreGte: null,
    from: '',
    to: '',
    includeDeleted: false,
    sortBy: 'completed_at' as const,
    sortDir: 'desc' as const,
  },
  withValues: {
    q: 'EMP001',
    status: 'completed' as const,
    scoreGte: 80,
    from: '2024-01-01',
    to: '2024-12-31',
    includeDeleted: false,
    sortBy: 'score' as const,
    sortDir: 'desc' as const,
  },
};

/**
 * Sample quiz data
 */
export const TEST_QUIZ = {
  id: 'quiz-123',
  tenantId: 'tenant-1',
  moduleId: 'module-1',
  passScore: 70,
  timeLimitSecs: 300,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  questions: [
    {
      id: 'q1',
      tenantId: 'tenant-1',
      quizId: 'quiz-123',
      text: 'What is 2+2?',
      order: 1,
      createdAt: '2024-01-01T00:00:00Z',
      options: [
        {
          id: 'q1-opt1',
          tenantId: 'tenant-1',
          questionId: 'q1',
          text: '3',
          isCorrect: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'q1-opt2',
          tenantId: 'tenant-1',
          questionId: 'q1',
          text: '4',
          isCorrect: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 'q2',
      tenantId: 'tenant-1',
      quizId: 'quiz-123',
      text: 'What is 5+3?',
      order: 2,
      createdAt: '2024-01-01T00:00:00Z',
      options: [
        {
          id: 'q2-opt1',
          tenantId: 'tenant-1',
          questionId: 'q2',
          text: '8',
          isCorrect: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'q2-opt2',
          tenantId: 'tenant-1',
          questionId: 'q2',
          text: '7',
          isCorrect: false,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ],
};

/**
 * Extended Mock Data for Comprehensive Testing
 */
import type { Database } from '@/integrations/supabase/types';

type Campaign = Database['public']['Tables']['awareness_campaigns']['Row'];
type Participant = Database['public']['Tables']['campaign_participants']['Row'];

export const MOCK_TENANT_ID = 'tenant-test-001';
export const MOCK_USER_ID = 'user-test-001';

export const mockCampaign: Campaign = {
  id: 'campaign-test-001',
  tenant_id: MOCK_TENANT_ID,
  name: 'Test Campaign',
  description: 'Campaign for testing',
  status: 'draft',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  start_at: null,
  end_at: null,
  is_test: true,
  owner_name: 'Test Owner',
  created_at: new Date().toISOString(),
  created_by: MOCK_USER_ID,
  updated_at: new Date().toISOString(),
  archived_at: null,
  archived_by: null,
};

export const mockParticipant: Participant = {
  id: 'participant-test-001',
  tenant_id: MOCK_TENANT_ID,
  campaign_id: 'campaign-test-001',
  employee_ref: 'EMP-001',
  status: 'invited',
  is_test: true,
  invited_at: new Date().toISOString(),
  opened_at: null,
  completed_at: null,
  score: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
};

export const mockUsers = {
  admin: {
    id: 'user-admin-001',
    email: 'admin@test.local',
    role: 'tenant_admin',
  },
  manager: {
    id: 'user-manager-001',
    email: 'manager@test.local',
    role: 'manager',
  },
  employee: {
    id: 'user-employee-001',
    email: 'employee@test.local',
    role: 'employee',
  },
};
