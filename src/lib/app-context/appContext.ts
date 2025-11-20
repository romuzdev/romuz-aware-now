// D1 – Common Infra – Part 1: Base app context placeholder.
// D1 – Common Infra – Part 2: Linked with AppContextProvider.tsx for live session context.
// This file defines where app.tenant_id and app.actor_id will be injected later.

/**
 * AppContext interface defines the shape of the application-level context
 * that will be used throughout the admin panel and other modules.
 */
export interface AppContext {
  tenantId: string | null;
  actorId: string | null;
  // TODO: add more fields later (roles, permissions, locale, etc.)
}

/**
 * TODO D1-Part2+: Implement real context wiring with middleware / server components.
 * 
 * For now this is just a placeholder to define the contract used by admin pages.
 * In future parts, this will be populated with actual session data from:
 * - Database session GUC (app.tenant_id, app.actor_id)
 * - Authentication system
 * - RBAC/permission resolution
 */
export function getInitialAppContext(): AppContext {
  return {
    tenantId: null,
    actorId: null,
  };
}
