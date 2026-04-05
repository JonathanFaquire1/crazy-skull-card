import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Card = {
  id: string
  user_id: string
  slug: string
  firstname: string
  lastname: string
  title?: string
  company?: string
  bio?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  linkedin?: string
  facebook?: string
  twitter?: string
  instagram?: string
  avatar_url?: string
  color_accent: string
  is_active: boolean
  scan_count: number
  save_count: number
  created_at: string
  updated_at?: string
}

export type Profile = {
  id: string
  role: 'admin' | 'client'
  created_at: string
}
