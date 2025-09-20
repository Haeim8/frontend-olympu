import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  if (typeof window !== 'undefined') {
    console.warn('[Livar] Supabase environment variables are missing. Promotion features are disabled.');
  }
}

export const supabase = supabaseClient;

export const BOOST_TYPES = {
  FEATURED: 'featured',
  TRENDING: 'trending',
  SPOTLIGHT: 'spotlight',
};

export const BOOST_PRIORITIES = {
  spotlight: 3,
  trending: 2,
  featured: 1,
};
