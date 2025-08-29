import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour TypeScript (optionnel)
export const BOOST_TYPES = {
  FEATURED: 'featured',
  TRENDING: 'trending', 
  SPOTLIGHT: 'spotlight'
};

export const BOOST_PRIORITIES = {
  spotlight: 3,
  trending: 2,
  featured: 1
};