// EPAVOne owns the existing EPAV Supabase backend; retain its project ID.
export function resolveSupabaseConfig(env = {}) {
  return Object.freeze({
    url: (env.VITE_SUPABASE_URL || env.VITE_CATALOG_URL || 'https://ytvztfvypiwgnslisxep.supabase.co').replace(/\/+$/, ''),
    key: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_CATALOG_PUBLISHABLE_KEY || 'sb_publishable_TdHX924qP71RTF3qKQGdUA_Zd9LcBRT'
  });
}

export const supabaseConfig = resolveSupabaseConfig(import.meta.env);
