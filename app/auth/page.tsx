'use client'
import { Suspense, useState } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthContent() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nfcCode = searchParams.get('nfc')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMessage('')
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setIsError(false)
        setMessage('✅ Compte créé ! Vous pouvez vous connecter.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (nfcCode) localStorage.setItem('pending_nfc', nfcCode)
        router.push('/dashboard'); router.refresh()
      }
    } catch (err: unknown) {
      setIsError(true)
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally { setLoading(false) }
  }

  async function handleForgotPassword() {
    if (!email) { setIsError(true); setMessage('Entrez votre email d\'abord.'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setIsError(true); setMessage(error.message) }
    else { setIsError(false); setResetSent(true); setMessage('✅ Email envoyé ! Vérifiez votre boîte mail.') }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(180,0,0,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(180,0,0,0.04) 0%, transparent 40%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo.png" alt="Crazy Skull Card" style={{ height: '80px', width: 'auto', margin: '0 auto' }} />
        </div>
        <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '40px 32px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', borderBottom: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '3px', marginBottom: '6px', color: '#e8e0d0' }}>
            {mode === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
          </h1>
          <p style={{ fontSize: '13px', color: '#5a5248', marginBottom: '32px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>
            {mode === 'login' ? 'Accédez à votre espace' : 'Rejoignez le crew'}
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@email.com"
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '14px 16px', color: '#e8e0d0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#cc0000'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8}
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '14px 48px 14px 16px', color: '#e8e0d0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#cc0000'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5248', fontSize: '16px', padding: '4px' }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {message && (
              <div style={{ fontSize: '13px', padding: '12px 16px', borderRadius: '2px', border: '1px solid', marginBottom: '16px', fontFamily: "'JetBrains Mono',monospace", color: isError ? '#ff4444' : '#00cc66', borderColor: isError ? 'rgba(255,68,68,0.2)' : 'rgba(0,204,102,0.2)', background: isError ? 'rgba(255,68,68,0.05)' : 'rgba(0,204,102,0.05)' }}>
                {message}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: loading ? '#333' : '#cc0000', border: 'none', borderRadius: '2px', padding: '16px', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '3px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {loading ? 'CHARGEMENT...' : mode === 'login' ? 'ENTRER' : 'REJOINDRE'}
            </button>
          </form>
          {mode === 'login' && !resetSent && (
            <p style={{ textAlign: 'center', marginTop: '16px' }}>
              <span onClick={handleForgotPassword} style={{ fontSize: '12px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', textDecoration: 'underline' }}>
                Mot de passe oublié ?
              </span>
            </p>
          )}
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace" }}>
            {mode === 'login' ? 'Pas de compte ? ' : 'Déjà membre ? '}
            <span style={{ color: '#cc0000', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}>
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#cc0000', letterSpacing: '2px', fontSize: '13px' }}>CHARGEMENT...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
