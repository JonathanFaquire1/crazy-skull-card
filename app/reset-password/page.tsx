'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setIsError(true); setMessage(error.message) }
    else { setIsError(false); setMessage('✅ Mot de passe mis à jour !'); setTimeout(() => router.push('/dashboard'), 2000) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0a0a0a' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', filter: 'drop-shadow(0 0 20px rgba(200,0,0,0.4))' }}>💀</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '36px', letterSpacing: '4px', color: '#e8e0d0' }}>CRAZY SKULL</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '20px', letterSpacing: '8px', color: '#cc0000' }}>CARD</div>
        </div>
        <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '40px 32px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', borderBottom: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '28px', letterSpacing: '3px', marginBottom: '6px', color: '#e8e0d0' }}>NOUVEAU MOT DE PASSE</h1>
          <p style={{ fontSize: '13px', color: '#5a5248', marginBottom: '32px', fontFamily: "'JetBrains Mono',monospace" }}>Choisissez un nouveau mot de passe</p>
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px', marginBottom: '8px' }}>NOUVEAU MOT DE PASSE</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '14px 48px 14px 16px', color: '#e8e0d0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#cc0000'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#5a5248', fontSize: '16px' }}>
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
              style={{ width: '100%', background: loading ? '#333' : '#cc0000', border: 'none', borderRadius: '2px', padding: '16px', color: '#fff', fontFamily: "'Bebas Neue',sans-serif", fontSize: '20px', letterSpacing: '3px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'CHARGEMENT...' : '💀 VALIDER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
