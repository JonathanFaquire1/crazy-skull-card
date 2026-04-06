t
'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { createClient, type Card } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import QRCodeCard from './QRCodeCard'
import ThemeToggle from '../../components/ThemeToggle'
import { useTheme } from 'next-themes'

export default function DashboardPage() {
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState<'card' | 'edit' | 'stats'>('card')
  const [form, setForm] = useState<Partial<Card>>({})
  const [toast, setToast] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [viewStats, setViewStats] = useState({
    total: 0,
    thisWeek: 0,
    today: 0,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  const bg = isLight ? '#ffffff' : '#0a0a0a'
  const panel = isLight ? '#f5f5f5' : '#161616'
  const panelAlt = isLight ? '#ffffff' : '#0a0a0a'
  const text = isLight ? '#1a1a1a' : '#e8e0d0'
  const muted = isLight ? '#666666' : '#9a9080'
  const faint = isLight ? '#888888' : '#5a5248'
  const border = isLight ? '#e5e5e5' : '#2a2a2a'
  const headerBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.95)'
  const softAccent = 'rgba(204,0,0,0.1)'
  const softAccentBorder = 'rgba(204,0,0,0.3)'
  const cardGradient = isLight
    ? 'linear-gradient(135deg, #fff5f5 0%, #ffeaea 50%, #fff8f8 100%)'
    : 'linear-gradient(135deg, #1a0000 0%, #2a0a0a 50%, #1a0505 100%)'

  useEffect(() => {
    loadCard()
  }, [])

  useEffect(() => {
    const pendingNfc = sessionStorage.getItem('pending_nfc_code')
    if (pendingNfc) {
      showToast(`📡 Carte NFC détectée : ${pendingNfc}`)
      sessionStorage.removeItem('pending_nfc_code')
      setTimeout(() => {
        router.push(`/activate?code=${pendingNfc}`)
      }, 700)
    }
  }, [router])

  useEffect(() => {
    if (tab === 'stats' && card?.slug) {
      loadStats(card.slug)
    }
  }, [tab, card?.slug])

  async function loadStats(slug: string) {
    try {
      const now = new Date()
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)

      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [
        { count: totalCount, error: totalError },
        { count: weekCount, error: weekError },
        { count: todayCount, error: todayError },
      ] = await Promise.all([
        supabase
          .from('card_views')
          .select('*', { count: 'exact', head: true })
          .eq('slug', slug),
        supabase
          .from('card_views')
          .select('*', { count: 'exact', head: true })
          .eq('slug', slug)
          .gte('viewed_at', weekAgo.toISOString()),
        supabase
          .from('card_views')
          .select('*', { count: 'exact', head: true })
          .eq('slug', slug)
          .gte('viewed_at', startOfToday.toISOString()),
      ])

      if (totalError || weekError || todayError) {
        console.error('Erreur chargement stats vues:', {
          totalError,
          weekError,
          todayError,
        })
        return
      }

      setViewStats({
        total: totalCount ?? 0,
        thisWeek: weekCount ?? 0,
        today: todayCount ?? 0,
      })
    } catch (error) {
      console.error('Erreur loadStats:', error)
    }
  }

  async function loadCard() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth')
      return
    }

    const { data } = await supabase.from('cards').select('*').eq('user_id', user.id).single()

    if (data) {
      setCard(data)
      setForm(data)
      if (data.avatar_url) setAvatarUrl(data.avatar_url)
    } else {
      setForm({
        firstname: '',
        lastname: '',
        color_accent: '#cc0000',
      })
      setTab('edit')
    }

    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function uploadAvatar(file: File) {
    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Non connecté')

      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path)

      setAvatarUrl(publicUrl)
      setForm((f) => ({ ...f, avatar_url: publicUrl }))
      showToast('💀 Photo mise à jour !')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  async function saveCard() {
    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    try {
      if (card) {
        const { error } = await supabase
          .from('cards')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', card.id)

        if (error) throw error

        setCard({ ...card, ...(form as Card) })
        showToast('✅ Carte sauvegardée !')
      } else {
        const slug = `${form.firstname}-${form.lastname}-${Math.random().toString(36).slice(2, 6)}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')

        const { data: newCard, error } = await supabase
          .from('cards')
          .insert({ ...form, user_id: user.id, slug })
          .select()
          .single()

        if (error || !newCard) {
          throw new Error('Erreur lors de la création de la carte')
        }

        const pendingCode = sessionStorage.getItem('pending_nfc_code')

        if (pendingCode && newCard.id) {
          const { error: linkError } = await supabase
            .from('nfc_tokens')
            .update({ card_id: newCard.id })
            .eq('code', pendingCode)

          if (linkError) throw linkError

          sessionStorage.removeItem('pending_nfc_code')
        }

        setCard(newCard)
        setForm(newCard)
        showToast('💀 Carte créée !')
        setTab('card')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function downloadVCF() {
    if (!card) return

    const res = await fetch(`/api/vcf/${card.slug}`)
    if (!res.ok) {
      showToast('Erreur téléchargement')
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${card.firstname}_${card.lastname}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📇 Fichier .vcf téléchargé !')
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const btnRed: React.CSSProperties = {
    width: '100%',
    background: '#cc0000',
    border: 'none',
    borderRadius: '2px',
    padding: '15px',
    color: '#fff',
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: '18px',
    letterSpacing: '3px',
    cursor: 'pointer',
  }

  const btnGhost: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: `1px solid ${border}`,
    borderRadius: '2px',
    padding: '15px',
    color: muted,
    fontFamily: "'Bebas Neue',sans-serif",
    fontSize: '18px',
    letterSpacing: '3px',
    cursor: 'pointer',
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <img
            src="/logo.png"
            alt="Crazy Skull Card"
            style={{ height: '80px', width: 'auto', margin: '0 auto 12px' }}
          />
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              color: '#cc0000',
              letterSpacing: '2px',
              fontSize: '13px',
            }}
          >
            CHARGEMENT...
          </div>
        </div>
      </div>
    )
  }

  const accent = form.color_accent || card?.color_accent || '#cc0000'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          borderBottom: `1px solid ${border}`,
          background: headerBg,
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/logo.png"
            alt="Crazy Skull Card"
            style={{ height: '40px', width: 'auto' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle />

          {card && (
            <a
              href={`/card/${card.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: softAccent,
                border: `1px solid ${softAccentBorder}`,
                borderRadius: '2px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#cc0000',
                textDecoration: 'none',
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: '1px',
              }}
            >
              APERÇU
            </a>
          )}

          <button
            onClick={logout}
            style={{
              background: 'none',
              border: `1px solid ${border}`,
              borderRadius: '2px',
              padding: '6px 12px',
              color: muted,
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            SORTIR
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, padding: '0 24px' }}>
        {([
          ['card', 'MA CARTE'],
          ['edit', '⚡ ÉDITER'],
          ['stats', '📊 STATS'],
        ] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #cc0000' : '2px solid transparent',
              padding: '14px 16px',
              color: tab === t ? '#cc0000' : faint,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Rajdhani',sans-serif",
              letterSpacing: '1px',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <main style={{ padding: '24px' }}>
        {tab === 'card' && card && (
          <div>
            <div
              style={{
                background: cardGradient,
                borderRadius: '4px',
                padding: '28px',
                position: 'relative',
                border: `1px solid ${accent}44`,
                marginBottom: '16px',
                minHeight: '180px',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logo.png"
                alt=""
                style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-20px',
                  width: '120px',
                  opacity: 0.04,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: softAccent,
                  border: `1px solid ${softAccentBorder}`,
                  borderRadius: '2px',
                  padding: '3px 10px',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono',monospace",
                  color: '#cc0000',
                  letterSpacing: '2px',
                }}
              >
                NFC ✦ vCard
              </div>

              <div
                style={{
                  width: '40px',
                  height: '30px',
                  background: 'linear-gradient(135deg,#d4a017,#f0c040,#b8860b)',
                  borderRadius: '3px',
                  marginBottom: '20px',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: `2px solid ${accent}`,
                    flexShrink: 0,
                    background: panelAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src="/logo.png"
                      alt=""
                      style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.6 }}
                    />
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: '22px',
                      letterSpacing: '2px',
                      color: isLight ? '#1a1a1a' : '#e8e0d0',
                      lineHeight: 1,
                    }}
                  >
                    {card.firstname} {card.lastname}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: isLight ? 'rgba(26,26,26,0.55)' : 'rgba(232,224,208,0.5)',
                      fontFamily: "'JetBrains Mono',monospace",
                      marginTop: '2px',
                    }}
                  >
                    {card.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div
                  style={{
                    fontSize: '13px',
                    color: isLight ? 'rgba(26,26,26,0.75)' : 'rgba(232,224,208,0.7)',
                    fontWeight: 600,
                    letterSpacing: '1px',
                  }}
                >
                  {card.company}
                </div>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: accent,
                    boxShadow: `0 0 10px ${accent}`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: panel,
                border: '1px solid rgba(204,0,0,0.2)',
                borderRadius: '2px',
                padding: '12px 16px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono',monospace",
                color: '#cc0000',
                marginBottom: '16px',
                wordBreak: 'break-all',
              }}
            >
              🔗 {process.env.NEXT_PUBLIC_APP_URL || 'https://crazyskullcards.fr'}/card/{card.slug}
            </div>

            <QRCodeCard slug={card.slug} firstname={card.firstname} lastname={card.lastname} />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '24px',
              }}
            >
              <button onClick={downloadVCF} style={btnRed}>
                📇 TÉLÉCHARGER .VCF
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/card/${card.slug}`)
                  showToast('🔗 URL copiée !')
                }}
                style={btnGhost}
              >
                📋 COPIER L&apos;URL
              </button>
            </div>

            <div
              style={{
                background: panel,
                border: `1px solid ${border}`,
                borderRadius: '4px',
                padding: '20px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '30px',
                  height: '30px',
                  borderTop: '1px solid #cc0000',
                  borderLeft: '1px solid #cc0000',
                }}
              />

              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: '16px',
                  letterSpacing: '3px',
                  marginBottom: '16px',
                  color: '#cc0000',
                }}
              >
                📡 PROGRAMMER LA CARTE NFC
              </div>

              {[
                'Téléchargez le fichier .vcf',
                'Ouvrez NFC Tools (iOS/Android)',
                'Écrire → Contact → Importez le .vcf',
                'Approchez votre carte NTAG215 → ✅',
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '10px',
                    fontSize: '13px',
                    color: muted,
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '2px',
                      background: softAccent,
                      border: `1px solid ${softAccentBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      color: '#cc0000',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'edit' && (
          <div>
            <SkullSection label="PHOTO DE PROFIL">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: panelAlt,
                  border: `1px solid ${border}`,
                  borderRadius: '2px',
                  padding: '16px',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    background: panel,
                    border: `2px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src="/logo.png"
                      alt=""
                      style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.6 }}
                    />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '12px',
                      color: faint,
                      marginBottom: '10px',
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {uploading ? '⏳ Upload...' : 'JPG, PNG, WebP — max 2MB'}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadAvatar(f)
                    }}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ ...btnRed, width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                  >
                    💀 {avatarUrl ? 'CHANGER' : 'AJOUTER'}
                  </button>
                </div>
              </div>
            </SkullSection>

            <SkullSection label="IDENTITÉ">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <SkullField
                  label="PRÉNOM"
                  value={form.firstname || ''}
                  onChange={(v) => setForm((f) => ({ ...f, firstname: v }))}
                />
                <SkullField
                  label="NOM"
                  value={form.lastname || ''}
                  onChange={(v) => setForm((f) => ({ ...f, lastname: v }))}
                />
              </div>

              <SkullField
                label="TITRE / POSTE"
                value={form.title || ''}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Ex: CEO, Artiste, Développeur..."
              />
              <SkullField
                label="ENTREPRISE / CREW"
                value={form.company || ''}
                onChange={(v) => setForm((f) => ({ ...f, company: v }))}
              />
              <SkullField
                label="BIO"
                value={form.bio || ''}
                onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                textarea
              />
            </SkullSection>

            <SkullSection label="CONTACT">
              <SkullField
                label="EMAIL"
                value={form.email || ''}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                type="email"
              />
              <SkullField
                label="TÉLÉPHONE"
                value={form.phone || ''}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                type="tel"
              />
              <SkullField
                label="SITE WEB"
                value={form.website || ''}
                onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                placeholder="https://..."
              />
              <SkullField
                label="ADRESSE"
                value={form.address || ''}
                onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="Paris, France"
              />
            </SkullSection>

            <SkullSection label="RÉSEAUX SOCIAUX">
              <SkullField
                label="LINKEDIN"
                value={form.linkedin || ''}
                onChange={(v) => setForm((f) => ({ ...f, linkedin: v }))}
                placeholder="https://linkedin.com/in/..."
              />
              <SkullField
                label="FACEBOOK"
                value={form.facebook || ''}
                onChange={(v) => setForm((f) => ({ ...f, facebook: v }))}
                placeholder="https://facebook.com/..."
              />
              <SkullField
                label="TWITTER / X"
                value={form.twitter || ''}
                onChange={(v) => setForm((f) => ({ ...f, twitter: v }))}
                placeholder="https://twitter.com/..."
              />
              <SkullField
                label="INSTAGRAM"
                value={form.instagram || ''}
                onChange={(v) => setForm((f) => ({ ...f, instagram: v }))}
                placeholder="https://instagram.com/..."
              />
            </SkullSection>

            <SkullSection label="COULEUR D'ACCENT">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['#cc0000', '#ff4400', '#ff6600', '#cc6600', '#8800cc', '#0066cc'].map((c) => (
                  <div
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color_accent: c }))}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '2px',
                      background: c,
                      cursor: 'pointer',
                      border: form.color_accent === c ? `3px solid ${text}` : '2px solid transparent',
                      transform: form.color_accent === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.2s',
                    }}
                  />
                ))}
              </div>
            </SkullSection>

            <button onClick={saveCard} disabled={saving} style={btnRed}>
              {saving ? '⏳ SAUVEGARDE...' : '💀 SAUVEGARDER LA CARTE'}
            </button>
          </div>
        )}

        {tab === 'stats' && card && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {[
                { v: viewStats.today, l: "VUES AUJOURD'HUI", c: '#cc0000', icon: '👁️' },
                { v: viewStats.thisWeek, l: 'VUES 7 JOURS', c: '#ff4400', icon: '📅' },
                { v: viewStats.total, l: 'VUES TOTALES', c: '#ff6600', icon: '📊' },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: panel,
                    border: `1px solid ${border}`,
                    borderRadius: '4px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/logo.png"
                    alt=""
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      right: '-10px',
                      width: '60px',
                      opacity: 0.05,
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: '44px',
                      color: s.c,
                      letterSpacing: '-1px',
                      lineHeight: 1,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: faint,
                      fontFamily: "'JetBrains Mono',monospace",
                      letterSpacing: '1px',
                      marginTop: '4px',
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {[
                { v: card.scan_count ?? 0, l: 'SCANS NFC', c: '#cc0000', icon: '📡' },
                { v: card.save_count ?? 0, l: 'CONTACTS SAUVÉS', c: '#ff6600', icon: '📇' },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    background: panel,
                    border: `1px solid ${border}`,
                    borderRadius: '4px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/logo.png"
                    alt=""
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      right: '-10px',
                      width: '60px',
                      opacity: 0.05,
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: '44px',
                      color: s.c,
                      letterSpacing: '-1px',
                      lineHeight: 1,
                    }}
                  >
                    {s.v}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: faint,
                      fontFamily: "'JetBrains Mono',monospace",
                      letterSpacing: '1px',
                      marginTop: '4px',
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: panel,
                border: `1px solid ${border}`,
                borderRadius: '4px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: '16px',
                  letterSpacing: '3px',
                  color: '#cc0000',
                  marginBottom: '10px',
                }}
              >
                📊 ANALYTICS EN TEMPS RÉEL
              </div>
              <p
                style={{
                  fontSize: '13px',
                  color: muted,
                  fontFamily: "'JetBrains Mono',monospace",
                  lineHeight: 1.6,
                }}
              >
                Chaque visite de carte, scan NFC et téléchargement de contact sont enregistrés dans Supabase.
              </p>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: panel,
            border: '1px solid #cc0000',
            borderRadius: '2px',
            padding: '10px 20px',
            fontSize: '13px',
            color: '#cc0000',
            fontFamily: "'JetBrains Mono',monospace",
            zIndex: 300,
            whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

function SkullField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  textarea?: boolean
}) {
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  const fieldBg = isLight ? '#ffffff' : '#0a0a0a'
  const fieldBorder = isLight ? '#dddddd' : '#2a2a2a'
  const fieldText = isLight ? '#1a1a1a' : '#e8e0d0'
  const fieldLabel = isLight ? '#777777' : '#5a5248'

  const style: React.CSSProperties = {
    width: '100%',
    background: fieldBg,
    border: `1px solid ${fieldBorder}`,
    borderRadius: '2px',
    padding: '12px 14px',
    color: fieldText,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px',
    minHeight: textarea ? '80px' : undefined,
    resize: textarea ? 'none' : undefined,
    fontFamily: "'Rajdhani',sans-serif",
  }

  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '10px',
          color: fieldLabel,
          fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '2px',
          marginBottom: '6px',
        }}
      >
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={style}
          onFocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#cc0000')}
          onBlur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = fieldBorder)}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={style}
          onFocus={(e) => (e.target.style.borderColor = '#cc0000')}
          onBlur={(e) => (e.target.style.borderColor = fieldBorder)}
        />
      )}
    </div>
  )
}

function SkullSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono',monospace",
          color: '#cc0000',
          letterSpacing: '2px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {label}
        <div
          style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(90deg, rgba(204,0,0,0.25), transparent)',
          }}
        />
      </div>
      {children}
    </div>
  )
}