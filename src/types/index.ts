export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  twitter?: string;
  github?: string;
  is_admin?: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface Tag {
  id: string;
  name: string;
}

export type PricingType = 'Free' | 'Freemium' | 'Paid' | 'Open Source' | 'Contact';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Creation {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string;
  screenshots: string[];
  category_id: string;
  subcategory_id?: string;
  pricing_type: PricingType;
  is_featured: boolean;
  is_student_indie: boolean;
  origin_country: string;
  status: SubmissionStatus;
  rejection_reason?: string;
  appreciations_count: number;
  bookmarks_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Joined or populated data
  tags?: string[];
  creator?: Profile;
  category?: Category;
  subcategory?: Subcategory;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  is_public: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  items?: Creation[];
}

export interface Report {
  id: string;
  reporter_id: string;
  creation_id: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  creation?: Creation;
}
