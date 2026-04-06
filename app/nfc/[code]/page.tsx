import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function createServerClient() {
  return createServerComponentClient({ cookies })
}

export default async function NfcPage({ 
  params 
}: { 
  params: Promise<{ code: string }> 
}) {
  const resolvedParams = await params
  const supabase = createServerClient()
  
  const { data: token } = await supabase
    .from('nfc_tokens')
    .select('id, code, card_id, status')
    .eq('code', resolvedParams.code)
    .single()

  if (!token) {
    redirect('/404')
  }

  if (token.status === 'unclaimed') {
    redirect(`/auth?claim=${resolvedParams.code}`)
  }

  if (token.status === 'claimed') {
    redirect('/dashboard/card')
  }

  if (token.status === 'active' && token.card_id) {
    const { data: card } = await supabase
      .from('cards')
      .select('slug')
      .eq('id', token.card_id)
      .single()

    if (card?.slug) {
      redirect(`/card/${card.slug}`)
    }
  }

  redirect('/dashboard/card')
}