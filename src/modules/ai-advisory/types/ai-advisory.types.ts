/**
 * M16: AI Advisory Engine - TypeScript Types
 */

export type ContextType = 
  | 'risk' 
  | 'compliance' 
  | 'audit' 
  | 'campaign' 
  | 'policy' 
  | 'action_plan' 
  | 'incident' 
  | 'security_event';

export type RecommendationStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'implemented' 
  | 'expired';

export type RecommendationPriority = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'low';

export type DecisionType = 
  | 'recommendation_generated'
  | 'recommendation_accepted'
  | 'recommendation_rejected'
  | 'recommendation_implemented'
  | 'feedback_provided'
  | 'recommendation_expired';

export interface AIRecommendation {
  id: string;
  tenant_id: string;
  
  // Context
  context_type: ContextType;
  context_id: string;
  context_snapshot?: any;
  
  // Content (Bilingual)
  title_ar: string;
  title_en?: string;
  description_ar: string;
  description_en?: string;
  rationale_ar?: string;
  rationale_en?: string;
  
  // AI Metadata
  model_used: string;
  confidence_score?: number;
  priority: RecommendationPriority;
  category?: string;
  
  // Status
  status: RecommendationStatus;
  generated_at: string;
  expires_at?: string;
  
  // Feedback
  feedback_rating?: number;
  feedback_comment?: string;
  feedback_at?: string;
  feedback_by?: string;
  
  // Actions
  accepted_at?: string;
  accepted_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  implemented_at?: string;
  implemented_by?: string;
  implementation_notes?: string;
  
  // Metadata
  tags?: string[];
  metadata?: any;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AIDecisionLog {
  id: string;
  tenant_id: string;
  
  recommendation_id?: string;
  context_type: ContextType;
  context_id?: string;
  
  decision_type: DecisionType;
  decision_maker?: string;
  
  model_used?: string;
  prompt_used?: string;
  response_received?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  confidence_score?: number;
  
  outcome?: string;
  outcome_details?: any;
  error_message?: string;
  
  decided_at: string;
}

export interface RecommendationRequest {
  context_type: ContextType;
  context_id: string;
  context_data?: any;
  language?: 'ar' | 'en' | 'both';
  tenant_id: string;
}

export interface RecommendationResponse {
  success: boolean;
  recommendation?: AIRecommendation;
  processing_time_ms?: number;
  error?: string;
}

export interface FeedbackRequest {
  recommendation_id: string;
  rating: number; // 1-5
  comment?: string;
}

export interface RecommendationFilters {
  context_type?: ContextType;
  status?: RecommendationStatus;
  priority?: RecommendationPriority;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface RecommendationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  implemented: number;
  expired: number;
  avg_confidence: number;
  avg_feedback_rating?: number;
  by_priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  by_context: Record<ContextType, number>;
}
