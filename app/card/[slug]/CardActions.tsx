'use client'

import QRCodeCanvas from 'qrcode

type Props = {
  slug: string
  firstname: string
  lastname: string
  accent: string
}

export default function CardActions({ slug, firstname, lastname, accent }: Props) {
  const downloadQR = async () => {
    try {
      const qrUrl = `${window.location.origin}/card/${slug}`

      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `CrazySkull-${slug}.png`
      link.click()
    } catch (error) {
      console.error('Erreur génération QR:', error)
      alert('Impossible de générer le QR code')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
      <a
        href={`/api/vcf/${slug}`}
        download={`${firstname}_${lastname}.vcf`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: accent,
          borderRadius: '2px',
          padding: '18px',
          color: '#fff',
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '22px',
          letterSpacing: '4px',
          textAlign: 'center',
          textDecoration: 'none',
          boxShadow: `0 8px 24px ${accent}40`,
        }}
      >
        <img src="/logo.png" alt="" style={{ height: '24px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
        ENREGISTRER LE CONTACT
      </a>

      <button
        onClick={downloadQR}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          background: '#00cc88',
          borderRadius: '2px',
          padding: '18px',
          color: '#fff',
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: '22px',
          letterSpacing: '4px',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,204,136,0.4)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        🖨️ TÉLÉCHARGER QR CODE
      </button>
    </div>
  )
}