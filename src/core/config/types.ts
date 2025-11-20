/**
 * Core Configuration Types
 * 
 * TypeScript types for app registry and configuration
 */

import type { LucideIcon } from 'lucide-react';

/**
 * App Module - Represents a complete application on the platform
 */
export interface AppModule {
  /** Unique identifier */
  id: string;
  
  /** Display name (English) */
  name: string;
  
  /** Display name (Arabic) */
  nameAr: string;
  
  /** Short description */
  description: string;
  
  /** App icon */
  icon: LucideIcon;
  
  /** Base route (e.g., '/app/awareness') */
  route: string;
  
  /** Required permission to access app */
  requiredPermission: string;
  
  /** Brand color (HSL) */
  color: string;
  
  /** App status */
  status: 'active' | 'beta' | 'coming_soon' | 'deprecated';
  
  /** App features/pages */
  features: AppFeature[];
  
  /** Other apps this depends on */
  dependencies?: string[];
  
  /** Metadata */
  metadata?: {
    version?: string;
    lastUpdated?: string;
    owner?: string;
  };
}

/**
 * App Feature - Page or feature within an app
 */
export interface AppFeature {
  /** Unique identifier within app */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Display name (Arabic) */
  nameAr: string;
  
  /** Feature route */
  route: string;
  
  /** Feature icon */
  icon: LucideIcon;
  
  /** Required permission */
  requiredPermission: string;
  
  /** Show in sidebar */
  showInSidebar?: boolean;
  
  /** Order in sidebar */
  order?: number;
}
