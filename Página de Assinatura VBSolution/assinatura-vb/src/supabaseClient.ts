import { createClient } from '@supabase/supabase-js'

const env = (import.meta as any).env || {}
const url = env.VITE_SUPABASE_URL as string | undefined
const key = env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined

export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null
