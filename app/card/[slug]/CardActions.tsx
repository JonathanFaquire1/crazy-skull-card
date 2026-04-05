'use client'

import { QRCodeCanvas } from 'qrcode.react'

type Props = {
  slug: string
  firstname: string
  lastname: string
  accent: string
}

export default function CardActions({ slug, firstname, lastname, accent }: Props) {
  const downloadQR = () => {
    const qrUrl = `${window.location.origin}/card/${slug}`
    
    // Canvas temporaire pour QR
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 800
    
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.innerHTML = `<QRCodeCanvas 
      value="${qrUrl}" 
      size={760}
      fgColor="#000000" 
      bgColor="#FFFFFF"
    />`
    
    document.body.appendChild(tempDiv)
    
    // Convertit en image après rendu
    setTimeout(() => {
      html2canvas(tempDiv.firstChild as HTMLElement, {
  width: 800,
  height: 800,
  scale: 2,
  backgroundColor: '#FFFFFF',
  useCORS: true,
        }).then((renderedCanvas) => {
        const dataUrl = renderedCanvas.toDataURL('image/png')
        
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `CrazySkull-${slug}.png`
        link.click()
        
        document.body.removeChild(tempDiv)
      }).catch((error) => {
        console.error('Erreur QR:', error)
        alert('Erreur génération QR code')
        document.body.removeChild(tempDiv)
      })
    }, 100)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '16px', 
      marginBottom: '32px' 
    }}>
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
        <img 
          src="/logo.png" 
          alt="" 
          style={{ 
            height: '24px', 
            width: 'auto', 
            filter: 'brightness(0) invert(1)' 
          }} 
        />
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