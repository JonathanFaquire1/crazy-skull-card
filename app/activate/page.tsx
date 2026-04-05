'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { Suspense } from 'react'

function ActivateContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const supabase = createClient()

  useEffect(() => {
    if (code) activateCard()
    else { setStatus('error'); setMessage('Code NFC manquant.') }
  }, [])

  async function activateCard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: token, error } = await supabase
      .from('nfc_tokens')
      .update({ activated_at: new Date().toISOString(), user_id: user.id })
      .eq('code', code)
      .is('activated_at', null)
      .select('*, cards(*)')
      .single()

    if (error || !token) {
      setStatus('error')
      setMessage('Code invalide ou déjà activé.')
      return
    }

    const { data: card } = await supabase
      .from('cards')
      .select('id, slug')
      .eq('user_id', user.id)
      .single()

    // ✅ BLOC REMPLACÉ ICI
    if (card) {
      await supabase.from('nfc_tokens').update({ card_id: card.id }).eq('code', code)
      setStatus('success')
      setMessage('Carte activée avec succès !')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      sessionStorage.setItem('pending_nfc_code', code!)
      setStatus('error')
      setMessage('Créez d\'abord votre carte dans le dashboard.')
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="" style={{ height: '80px', marginBottom: '24px' }} />
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '24px', letterSpacing: '3px', color: status === 'success' ? '#00cc66' : status === 'error' ? '#ff4444' : '#cc0000', marginBottom: '12px' }}>
          {status === 'loading' ? 'ACTIVATION...' : status === 'success' ? '✅ ACTIVÉE !' : '❌ ERREUR'}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: '#9a9080' }}>{message}</div>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#cc0000', letterSpacing: '2px', fontSize: '13px' }}>CHARGEMENT...</div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  )
}