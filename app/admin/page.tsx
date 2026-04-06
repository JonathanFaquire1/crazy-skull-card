'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient, type Card } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, scans: 0, saves: 0, active: 0 })
  const [tokens, setTokens] = useState<any[]>([])
  const [tokenTab, setTokenTab] = useState<'all' | 'active' | 'free'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkAndLoad() }, []) 

  async function checkAndLoad() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }
    const { data: allCards } = await supabase.from('cards').select('*').order('created_at', { ascending: false })
    if (allCards) {
      setCards(allCards)
      setStats({ total: allCards.length, scans: allCards.reduce((s, c) => s + (c.scan_count || 0), 0), saves: allCards.reduce((s, c) => s + (c.save_count || 0), 0), active: allCards.filter(c => c.is_active).length })
    }
    const { data: allTokens } = await supabase
  .from('nfc_tokens')
  .select('*, cards(firstname, lastname, slug)')
  .order('code', { ascending: true })
if (allTokens) setTokens(allTokens)
    setLoading(false)
  }

  async function toggleCard(id: string, current: boolean) {
    await supabase.from('cards').update({ is_active: !current }).eq('id', id)
    setCards(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
  }

  async function deleteCard(id: string, name: string) {
  if (!confirm(`Supprimer la carte de ${name} ? Cette action est irréversible.`)) return
  await supabase.from('cards').delete().eq('id', id)
  setCards(prev => prev.filter(c => c.id !== id))
  setStats(prev => ({ ...prev, total: prev.total - 1 }))
}

async function resetToken(code: string) {
  if (!confirm(`Réinitialiser le token ${code} ? Le client perdra l'accès.`)) return
  await supabase.from('nfc_tokens')
    .update({ 
      status: 'unclaimed',      // ← AJOUTÉ
      activated_at: null, 
      user_id: null, 
      card_id: null 
    })
    .eq('code', code)
  setTokens(prev => prev.map(t => t.code === code
    ? { ...t, status: 'unclaimed', activated_at: null, user_id: null, card_id: null, cards: null }  // ← AJOUTÉ status
    : t))
}

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#cc0000', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px' }}>
    <img src="/logo.png" alt="" style={{ height: '50px', width: 'auto', marginBottom: '8px' }} /> CHARGEMENT...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d0', fontFamily: "'Rajdhani',sans-serif" }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid #2a2a2a', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Crazy Skull Card" style={{ height: '40px', width: 'auto' }} />
          <span style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '2px', padding: '3px 10px', fontSize: '11px', color: '#ffd700', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px' }}>ADMIN</span>
        </div>
        <a href="/dashboard" style={{ color: '#9a9080', fontSize: '12px', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>MON COMPTE →</a>
      </header>

      <main style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '36px', letterSpacing: '4px', marginBottom: '32px' }}>
          DASHBOARD <span style={{ color: '#cc0000' }}>ADMIN</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
          {[{ v: stats.total, l: 'CARTES', c: '#cc0000' }, { v: stats.active, l: 'ACTIVES', c: '#ff6600' }, { v: stats.scans, l: 'SCANS NFC', c: '#cc0000' }, { v: stats.saves, l: 'SAUVÉS', c: '#ff6600' }].map(s => (
            <div key={s.l} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <img src="/logo.png" alt="" style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '50px', opacity: 0.04, pointerEvents: 'none' }} />
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '40px', color: s.c, letterSpacing: '-1px', lineHeight: 1, marginBottom: '4px' }}>{s.v}</div>
              <div style={{ fontSize: '10px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: '#cc0000', letterSpacing: '2px', marginBottom: '16px' }}>
          TOUTES LES CARTES ({cards.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cards.map(card => (
            <div key={card.id} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '2px', overflow: 'hidden', background: '#0a0a0a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.avatar_url ? <img src={card.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src="/logo.png" alt="" style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.6 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '18px', letterSpacing: '2px', marginBottom: '2px' }}>{card.firstname} {card.lastname}</div>
                <div style={{ fontSize: '11px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace" }}>
                  /card/{card.slug} · 📡 {card.scan_count} · 📇 {card.save_count}
                </div>
              </div>
              <button onClick={() => toggleCard(card.id, card.is_active)}
                style={{ background: card.is_active ? 'rgba(0,180,0,0.1)' : 'rgba(180,0,0,0.1)', border: `1px solid ${card.is_active ? 'rgba(0,180,0,0.3)' : 'rgba(180,0,0,0.3)'}`, borderRadius: '2px', padding: '6px 14px', color: card.is_active ? '#00cc44' : '#cc0000', cursor: 'pointer', fontSize: '12px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '1px' }}>
                {card.is_active ? '✅ ACTIF' : '❌ INACTIF'}
              </button>
              <a href={`/card/${card.slug}`} target="_blank" style={{ color: '#cc0000', fontSize: '13px', textDecoration: 'none', fontFamily: "'JetBrains Mono',monospace" }}>VOIR →</a>


<button onClick={() => deleteCard(card.id, `${card.firstname} ${card.lastname}`)}
  style={{ background: 'rgba(180,0,0,0.1)', border: '1px solid rgba(180,0,0,0.3)', borderRadius: '2px', padding: '6px 14px', color: '#cc0000', cursor: 'pointer', fontSize: '12px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '1px' }}>
  🗑️ SUPPR
</button>

            </div>
          ))}
          {cards.length === 0 && (
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '40px', textAlign: 'center', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px' }}>
              💀 AUCUNE CARTE CRÉÉE
            </div>
          )}
        </div>

        <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '24px', marginTop: '32px' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '18px', letterSpacing: '3px', color: '#cc0000', marginBottom: '12px' }}>⚙️ DEVENIR ADMIN</div>
          <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '12px 16px', color: '#cc0000', fontSize: '12px', fontFamily: "'JetBrains Mono',monospace" }}>
            UPDATE public.profiles SET role = &apos;admin&apos; WHERE id = &apos;VOTRE-UUID&apos;;
          </div>
        </div>

{/* ===== TOKENS NFC ===== */}
<div style={{ marginTop: '32px' }}>
  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '24px', letterSpacing: '4px', marginBottom: '16px' }}>
    TOKENS <span style={{ color: '#cc0000' }}>NFC</span>
  </div>

  {/* Stats tokens */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
    {[
      { v: tokens.length, l: 'TOTAL', c: '#cc0000' },
      { v: tokens.filter(t => t.activated_at && t.user_id).length, l: 'ACTIVÉS', c: '#00cc44' },
      { v: tokens.filter(t => !t.activated_at).length, l: 'LIBRES', c: '#ff6600' }
    ].map(s => (
      <div key={s.l} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '36px', color: s.c, lineHeight: 1 }}>{s.v}</div>
        <div style={{ fontSize: '10px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px', marginTop: '4px' }}>{s.l}</div>
      </div>
    ))}
  </div>

  {/* Filtres */}
  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
    {([['all', 'TOUS'], ['active', 'ACTIVÉS'], ['free', 'LIBRES']] as const).map(([v, l]) => (
      <button key={v} onClick={() => setTokenTab(v)}
        style={{ background: tokenTab === v ? '#cc0000' : 'transparent', border: '1px solid', borderColor: tokenTab === v ? '#cc0000' : '#2a2a2a', borderRadius: '2px', padding: '6px 16px', color: tokenTab === v ? '#fff' : '#5a5248', cursor: 'pointer', fontSize: '12px', fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '1px' }}>
        {l}
      </button>
    ))}
  </div>

  {/* Liste tokens */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
    {tokens
      .filter(t => tokenTab === 'all' ? true : tokenTab === 'active' ? !!t.activated_at : !t.activated_at)
      .map(token => (
        <div key={token.code} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Code */}
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', color: '#cc0000', minWidth: '100px' }}>{token.code}</div>
          {/* Statut */}
          <div style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '2px', border: '1px solid', color: token.activated_at ? '#00cc44' : '#5a5248', borderColor: token.activated_at ? 'rgba(0,204,68,0.3)' : '#2a2a2a', background: token.activated_at ? 'rgba(0,204,68,0.05)' : 'transparent', fontFamily: "'JetBrains Mono',monospace" }}>
            {token.activated_at ? '✅ ACTIVÉ' : '⬜ LIBRE'}
          </div>
          {/* Client lié */}
          <div style={{ flex: 1, fontSize: '12px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace" }}>
            {token.cards ? `👤 ${token.cards.firstname} ${token.cards.lastname}` : '—'}
          </div>
          {/* Date activation */}
          <div style={{ fontSize: '11px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace" }}>
            {token.activated_at ? new Date(token.activated_at).toLocaleDateString('fr-FR') : ''}
          </div>
          {/* Reset */}
          {token.activated_at && (
            <button onClick={() => resetToken(token.code)}
              style={{ background: 'rgba(180,0,0,0.1)', border: '1px solid rgba(180,0,0,0.3)', borderRadius: '2px', padding: '4px 10px', color: '#cc0000', cursor: 'pointer', fontSize: '11px', fontFamily: "'JetBrains Mono',monospace" }}>
              🔄 RESET
            </button>
          )}
        </div>
      ))}
  </div>
</div>

      </main>
    </div>
  )
}

