export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '../../../lib/supabase-server'
import ScanTracker from './ScanTracker'
import CardActions from './CardActions'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export default async function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Track la visite (fire and forget, sans bloquer le rendu)
  const headersList = await headers()
  const supabase = createClient()
  supabase.from('card_views').insert({
    slug,
    user_agent: headersList.get('user-agent'),
    referrer: headersList.get('referer'),
  }).then(() => {})

  // Chargement de la carte
  const supabaseServer = await createServerSupabaseClient()
  const { data: card } = await supabaseServer
    .from('cards')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!card) notFound()

  const accent = card.color_accent || '#cc0000'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e0d0', fontFamily: "'Rajdhani',sans-serif", maxWidth: '480px', margin: '0 auto' }}>
      
      <ScanTracker slug={slug} />
      
      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, #1a0000 0%, #0a0a0a 100%)`, borderBottom: `1px solid ${accent}33`, padding: '48px 24px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

        {/* Avatar */}
        <div style={{ width: '110px', height: '110px', borderRadius: '4px', overflow: 'hidden', background: '#161616', border: `2px solid ${accent}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${accent}30` }}>
          {card.avatar_url
            ? <img src={card.avatar_url} alt={`${card.firstname} ${card.lastname}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src="/logo.png" alt="Crazy Skull Card" style={{ width: '80%', height: '80%', objectFit: 'contain', opacity: 0.6 }} />
          }
        </div>

        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '34px', letterSpacing: '3px', marginBottom: '4px', lineHeight: 1 }}>
          {card.firstname} {card.lastname}
        </h1>
        {card.title && <p style={{ fontSize: '14px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace", marginBottom: '16px', letterSpacing: '1px' }}>{card.title}</p>}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {card.company && <span style={{ background: `${accent}18`, border: `1px solid ${accent}33`, borderRadius: '2px', padding: '4px 12px', fontSize: '12px', color: accent, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px' }}>{card.company}</span>}
          {card.address && <span style={{ background: 'rgba(232,224,208,0.05)', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '4px 12px', fontSize: '12px', color: '#9a9080', fontFamily: "'JetBrains Mono',monospace" }}>{card.address}</span>}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Bio */}
        {card.bio && (
          <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '24px', height: '24px', borderTop: `1px solid ${accent}`, borderLeft: `1px solid ${accent}` }} />
            <p style={{ fontSize: '15px', color: '#9a9080', lineHeight: 1.7, margin: 0 }}>{card.bio}</p>
          </div>
        )}

        {/* Contact */}
        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: accent, letterSpacing: '2px', marginBottom: '10px' }}>CONTACT</div>
        <div style={{ marginBottom: '24px' }}>
          {card.email   && <ContactRow icon="📧" label="EMAIL"     value={card.email}   href={`mailto:${card.email}`} accent={accent} />}
          {card.phone   && <ContactRow icon="📱" label="TÉLÉPHONE" value={card.phone}   href={`tel:${card.phone}`} accent={accent} />}
          {card.website && <ContactRow icon="🌐" label="SITE WEB"  value={card.website.replace(/^https?:\/\//, '')} href={card.website} accent={accent} />}
        </div>

        {/* Réseaux */}
        {(card.linkedin || card.facebook || card.twitter || card.instagram) && (
          <>
            <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: accent, letterSpacing: '2px', marginBottom: '10px' }}>RÉSEAUX</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
              {card.linkedin  && <SocialBtn icon="💼" label="LINKEDIN"  href={card.linkedin} accent={accent} />}
              {card.facebook  && <SocialBtn icon="📘" label="FACEBOOK"  href={card.facebook} accent={accent} />}
              {card.twitter   && <SocialBtn icon="🐦" label="TWITTER"   href={card.twitter} accent={accent} />}
              {card.instagram && <SocialBtn icon="📸" label="INSTAGRAM" href={card.instagram} accent={accent} />}
            </div>
          </>
        )}

        <CardActions
          slug={slug}
          firstname={card.firstname}
          lastname={card.lastname}
          accent={accent}
        />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#2a2a2a', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <img src="/logo.png" alt="" style={{ height: '14px', width: 'auto', opacity: 0.3 }} />
          CRAZY SKULL CARD · <span style={{ color: accent }}>crazyskullcards.fr</span>
        </div>
      </div>
    </div>
  )
}

function ContactRow({ icon, label, value, href, accent }: { icon: string; label: string; value: string; href: string; accent: string }) {
  return (
    <a href={href} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '14px 16px', textDecoration: 'none', color: '#e8e0d0', marginBottom: '10px' }}>
      <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '10px', color: '#5a5248', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '2px' }}>{label}</div>
        <div style={{ fontSize: '15px', fontWeight: 600 }}>{value}</div>
      </div>
      <span style={{ color: accent, fontSize: '18px' }}>›</span>
    </a>
  )
}

function SocialBtn({ icon, label, href, accent }: { icon: string; label: string; href: string; accent: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ background: '#161616', border: `1px solid #2a2a2a`, borderRadius: '2px', padding: '14px 0', textAlign: 'center', textDecoration: 'none', color: '#e8e0d0', display: 'block' }}>
      <div style={{ fontSize: '20px' }}>{icon}</div>
      <div style={{ fontSize: '9px', color: '#5a5248', marginTop: '4px', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '1px' }}>{label}</div>
    </a>
  )
}