import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL")
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseAnonKey) throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_ANON_KEY")

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
