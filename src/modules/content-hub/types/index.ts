/**
 * M13.1 Content Hub - Type Definitions
 */

export type InteractionType = 'view' | 'like' | 'unlike' | 'share' | 'bookmark' | 'unbookmark';

export type ShareChannel = 'email' | 'whatsapp' | 'twitter' | 'linkedin' | 'copy_link';

export interface ContentInteractionState {
  hasLiked: boolean;
  hasBookmarked: boolean;
  isLoading: boolean;
}

export interface ContentStats {
  views: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
}

export interface CommentFormData {
  text: string;
  parentId?: string;
}

export interface BookmarkFormData {
  folderName?: string;
  notes?: string;
}

export interface TemplateStructure {
  fields: TemplateField[];
  layout?: 'single' | 'split' | 'grid';
}

export interface TemplateField {
  id: string;
  type: 'text' | 'rich-text' | 'image' | 'video' | 'quiz' | 'embed';
  label: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface AIGenerationRequest {
  templateId?: string;
  contentType: string;
  topic: string;
  tone?: 'professional' | 'casual' | 'educational' | 'engaging';
  language?: 'ar' | 'en';
  targetAudience?: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
}

export interface AIGenerationResult {
  title_ar: string;
  title_en?: string;
  content_body_ar: string;
  content_body_en?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  quality_score?: number;
  reading_time_minutes?: number;
}
