import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default async function NfcPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = createClient()

  const { data: token } = await supabase
    .from('nfc_tokens')
    .select('*, cards(slug)')
    .eq('code', code)
    .single()

    console.log('TOKEN DATA:', JSON.stringify(token, null, 2))

  if (token?.activated_at && token?.cards?.slug) {
    redirect(`/card/${token.cards.slug}`)
  }

  if (token && !token.activated_at) {
    redirect(`/activate?code=${code}`)
  }

  redirect('/404')
}