export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '../lib/supabase-server'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  else redirect('/dashboard')
}
