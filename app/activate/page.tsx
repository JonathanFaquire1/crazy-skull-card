'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { normalizeNfcCode, pendingNfcKey } from '../../lib/nfc'

function ActivateContent() {
  const [message, setMessage] = useState('Activation en cours…')
  const [failed, setFailed] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const code = normalizeNfcCode(params.get('code'))
  const supabase = createClient()
  useEffect(() => {
    let cancelled = false
    async function activate() {
      if (!code) { setFailed(true); setMessage('Code NFC manquant ou invalide.'); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { router.replace(`/auth?nfc=${code}`); return }
      const { data, error } = await supabase.rpc('claim_nfc_token', { p_code: code })
      if (cancelled) return
      if (error || !data?.success) {
        setFailed(true); setMessage(error?.message || data?.message || 'Activation impossible.'); return
      }
      if (data.needs_card) sessionStorage.setItem(pendingNfcKey, code)
      else sessionStorage.removeItem(pendingNfcKey)
      router.replace('/dashboard')
    }
    void activate().catch(() => { if (!cancelled) { setFailed(true); setMessage('Connexion impossible. Réessayez.'); } })
    return () => { cancelled = true }
  }, [code, router, supabase])
  return <main style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 24 }}>
    <div style={{ textAlign: 'center' }}>
      <img src="/logo.png" alt="Crazy Skull Card" style={{ height: 80, margin: '0 auto 24px' }} />
      <h1>{failed ? 'Activation impossible' : 'Activation NFC'}</h1>
      <p role="status">{message}</p>
      {failed ? <a href="/dashboard">Retour à mon espace</a> : null}
    </div>
  </main>
}
export default function ActivatePage() {
  return <Suspense fallback={<p role="status">Chargement…</p>}><ActivateContent /></Suspense>
}
