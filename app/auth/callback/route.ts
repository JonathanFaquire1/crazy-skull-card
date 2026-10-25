import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../lib/supabase-server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const requestedNext = request.nextUrl.searchParams.get('next') || '/dashboard'
  // Only known application routes can be used after authentication.
  const next = requestedNext === '/reset-password' || requestedNext === '/dashboard' ||
    /^\/activate\?code=SKU[0-9]{5}$/.test(requestedNext) ? requestedNext : '/dashboard'
  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }
  return NextResponse.redirect(new URL('/auth?error=confirmation', request.url))
}
