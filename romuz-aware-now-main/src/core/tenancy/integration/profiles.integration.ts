/**
 * Profiles Integration
 * Handles user profile operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch current user's profile
 */
export async function fetchMyProfile(): Promise<UserProfile | null> {
  console.log('🔍 Fetching profile...');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No authenticated user');
    throw new Error('User not authenticated');
  }

  console.log('👤 Fetching profile for user:', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching profile:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  console.log('📥 Profile fetched:', data ? 'Found' : 'Not found');
  return data;
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  console.log('🔐 Getting authenticated user...');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No authenticated user found');
    throw new Error('User not authenticated');
  }

  console.log('👤 User ID:', user.id);
  console.log('📦 Updates to apply:', updates);

  const payload = { id: user.id, ...updates };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('❌ Supabase update error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      full: error
    });
    throw error;
  }

  console.log('✅ Profile updated in database:', data);
  return data;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Create unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Delete old avatar if exists
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(user.id);

  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove([`${user.id}/${existingFiles[0].name}`]);
  }

  // Upload new avatar
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // Consider profile complete if user has at least full_name
  return !!profile.full_name && profile.full_name.trim().length > 0;
}
