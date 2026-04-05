import type { Card } from './supabase'

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n').replace(/\r/g, '')
}

export async function generateVCF(card: Card): Promise<string> {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${escapeVCard(`${card.firstname} ${card.lastname}`)}`,
    `N:${escapeVCard(card.lastname)};${escapeVCard(card.firstname)};;;`,
  ]
  if (card.title)      lines.push(`TITLE:${escapeVCard(card.title)}`)
  if (card.company)    lines.push(`ORG:${escapeVCard(card.company)}`)
  if (card.email)      lines.push(`EMAIL;TYPE=WORK:${card.email}`)
  if (card.phone)      lines.push(`TEL;TYPE=CELL:${card.phone}`)
  if (card.website)    lines.push(`URL:${card.website}`)
  if (card.address)    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(card.address)};;;;`)
  if (card.linkedin)   lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.linkedin}`)
  if (card.facebook)   lines.push(`X-SOCIALPROFILE;TYPE=facebook:${card.facebook}`)
  if (card.twitter)    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${card.twitter}`)
  if (card.instagram)  lines.push(`X-SOCIALPROFILE;TYPE=instagram:${card.instagram}`)
  if (card.bio)        lines.push(`NOTE:${escapeVCard(card.bio)}`)

  // ✅ Photo en base64
  if (card.avatar_url) {
    try {
      const imgRes = await fetch(card.avatar_url)
      const imgBuffer = await imgRes.arrayBuffer()
      const base64 = Buffer.from(imgBuffer).toString('base64')
      const mime = imgRes.headers.get('content-type') || 'image/jpeg'
      const type = mime.split('/')[1].toUpperCase()
      lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`)
    } catch {
      lines.push(`PHOTO;VALUE=URI:${card.avatar_url}`)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  if (appUrl) lines.push(`URL;TYPE=NFC:${appUrl}/card/${card.slug}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function slugify(firstname: string, lastname: string): string {
  const base = `${firstname}-${lastname}`.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}
