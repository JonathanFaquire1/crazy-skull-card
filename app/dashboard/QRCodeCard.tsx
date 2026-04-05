'use client'

import { useTheme } from 'next-themes'
import QRCode from 'qrcode' 

type Props = {
  slug: string
  firstname?: string | null
  lastname?: string | null
}

export default function QRCodeCard({ slug, firstname, lastname }: Props) {
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  const panel = isLight ? '#f5f5f5' : '#161616'
  const panelAlt = isLight ? '#ffffff' : '#0a0a0a'
  const muted = isLight ? '#666666' : '#9a9080'
  const border = isLight ? '#e5e5e5' : '#2a2a2a'

  const cardUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/card/${slug}` : ''

  function downloadQRCode() {
    const canvas = document.getElementById(`qr-code-canvas-${slug}`) as HTMLCanvasElement | null
    if (!canvas) return

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `qr-code-${firstname || 'card'}-${lastname || ''}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(cardUrl)
      alert('Lien de la carte copié ✅')
    } catch {
      alert('Impossible de copier le lien')
    }
  }

  if (!slug) return null

  return (
    <div
      style={{
        background: panel,
        border: `1px solid ${border}`,
        borderRadius: '4px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '16px',
          letterSpacing: '3px',
          marginBottom: '16px',
          color: '#cc0000',
        }}
      >
        QR CODE DE LA CARTE
      </div>

      <p
        style={{
          fontSize: '13px',
          color: muted,
          fontFamily: "'JetBrains Mono',monospace",
          lineHeight: 1.6,
          marginBottom: '16px',
        }}
      >
        Si le téléphone n’a pas le NFC, ce QR code permet d’ouvrir directement la carte de visite.
      </p>

      <div
        style={{
          background: '#fff',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {cardUrl && (
          <canvas 
  ref={(canvas) => {
  if (canvas && cardUrl) {
    QRCode.toCanvas(canvas, cardUrl, { 
      width: 220,
      margin: 1,
      color: { dark: '#000', light: '#fff' }
    })
  }
}}
  style={{ width: '220px', height: '220px' }}
/>
        )}
      </div>

      <div
        style={{
          background: panelAlt,
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
        {cardUrl}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <button
          onClick={downloadQRCode}
          style={{
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
          }}
        >
          TÉLÉCHARGER QR
        </button>

        <button
          onClick={copyUrl}
          style={{
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
          }}
        >
          COPIER LE LIEN
        </button>
      </div>
    </div>
  )
}