'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('Continuez pour terminer la confirmation ou la récupération de votre compte.')
  const [failed,setFailed] = useState(false)
  async function confirm() {
    setBusy(true)
    try {
      const url = new URL(window.location.href)
      const fragment = new URLSearchParams(url.hash.slice(1))
      const code = url.searchParams.get('code')
      const accessToken = fragment.get('access_token')
      const refreshToken = fragment.get('refresh_token')
      const requestedNext = fragment.get('type') === 'recovery' ? '/reset-password' : url.searchParams.get('next')
      const next = requestedNext === '/reset-password' || requestedNext === '/dashboard' ||
        /^\/activate\?code=SKU[0-9]{5}$/.test(requestedNext || '') ? requestedNext! : '/dashboard'
      // Remove auth material before constructing the SDK client: no automatic competing exchange,
      // no tokens in history, referrers, or subsequent navigation.
      window.history.replaceState(null,'','/auth/callback')
      const supabase = createClient()
      if (fragment.has('error') || url.searchParams.has('error')) {
        throw new Error('Ce lien a déjà été utilisé ou a expiré. Demandez un nouvel email.')
      }
      let error
      if (code) ({error} = await supabase.auth.exchangeCodeForSession(code))
      else if (accessToken && refreshToken) ({error} = await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken}))
      else throw new Error('Ce lien est incomplet. Ouvrez le lien reçu par email.')
      if (error) {
        if (error.code === 'pkce_code_verifier_not_found') throw new Error('Ouvrez ce lien dans le navigateur où vous avez demandé l’email. Si le lien a déjà été utilisé, demandez-en un nouveau.')
        throw new Error('Ce lien a déjà été utilisé ou a expiré. Demandez un nouvel email.')
      }
      const {data:{user},error:userError} = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Session non confirmée. Demandez un nouvel email.')
      router.replace(next)
      router.refresh()
    } catch(error) {
      setFailed(true)
      setMessage(error instanceof Error ? error.message : 'Confirmation impossible.')
      setBusy(false)
    }
  }
  return <main style={{minHeight:'80vh',display:'grid',placeItems:'center',padding:24}}>
    <div style={{maxWidth:440,textAlign:'center'}}>
      <h1>Confirmer mon accès</h1>
      <p role={failed ? 'alert' : 'status'}>{message}</p>
      {!failed ? <button disabled={busy} onClick={confirm} style={{padding:'12px 24px',margin:16}}>{busy ? 'Vérification…' : 'CONTINUER'}</button> : <a href="/auth">Retour à la connexion</a>}
    </div>
  </main>
}
