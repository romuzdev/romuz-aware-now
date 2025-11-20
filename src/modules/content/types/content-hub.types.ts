/**
 * M13.1 - Content Hub Types
 */

export type ContentType = 'article' | 'video' | 'document' | 'presentation' | 'infographic' | 'quiz' | 'podcast';
export type ContentStatus = 'draft' | 'published' | 'archived' | 'under_review';
export type ContentCategory = 'security' | 'compliance' | 'privacy' | 'incident_response' | 'best_practices' | 'policy' | 'training';

export interface ContentItem {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  content_type: ContentType;
  category: ContentCategory;
  tags: string[];
  thumbnail_url?: string;
  file_url?: string;
  video_url?: string;
  duration_minutes?: number;
  author_id: string;
  author_name: string;
  status: ContentStatus;
  views_count: number;
  likes_count: number;
  downloads_count: number;
  metadata: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    language?: string;
    format?: string;
    file_size?: number;
  };
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface ContentFilters {
  type?: ContentType[];
  category?: ContentCategory[];
  status?: ContentStatus[];
  tags?: string[];
  search?: string;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ContentStats {
  total_items: number;
  by_type: Record<ContentType, number>;
  by_category: Record<ContentCategory, number>;
  total_views: number;
  total_downloads: number;
  trending_items: ContentItem[];
  recent_items: ContentItem[];
}

export interface ContentActivity {
  id: string;
  content_id: string;
  user_id: string;
  user_name: string;
  activity_type: 'view' | 'download' | 'like' | 'share' | 'comment';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CreateContentInput {
  title: string;
  description: string;
  content_type: ContentType;
  category: ContentCategory;
  tags: string[];
  thumbnail_url?: string;
  file_url?: string;
  video_url?: string;
  duration_minutes?: number;
  metadata?: ContentItem['metadata'];
}

export interface UpdateContentInput extends Partial<CreateContentInput> {
  status?: ContentStatus;
}
