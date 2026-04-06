import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const qrUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://crazy-skull-card.vercel.app'}/card/${slug}`
    
    const dataUrl = await QRCode.toDataURL(qrUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Convertir dataURL en buffer
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename=CrazySkull-${slug}.png`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur génération QR' }, { status: 500 })
  }
}