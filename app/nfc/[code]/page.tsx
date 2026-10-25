import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { normalizeNfcCode } from '../../../lib/nfc'

export default async function NfcPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const normalizedCode = normalizeNfcCode(code)
  if (!normalizedCode) notFound()
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )

  const { data: token } = await supabase
    .from('nfc_tokens')
    .select('id, code, card_id, status, activated_at')
    .eq('code', normalizedCode)
    .single()

  if (!token) {
    notFound()
  }

  if (token.status === 'unclaimed') {
    redirect(`/activate?code=${normalizedCode}`)
  }

  if (token.card_id) {
    const { data: card } = await supabase
      .from('cards')
      .select('slug')
      .eq('id', token.card_id)
      .single()

    if (card?.slug) {
      redirect(`/card/${card.slug}`)
    }
  }

  redirect(`/activate?code=${normalizedCode}`)
}
