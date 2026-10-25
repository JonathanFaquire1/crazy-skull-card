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
  if (card.email)      lines.push(`EMAIL;TYPE=WORK:${escapeVCard(card.email)}`)
  if (card.phone)      lines.push(`TEL;TYPE=CELL:${escapeVCard(card.phone)}`)
  if (card.website)    lines.push(`URL:${escapeVCard(card.website)}`)
  if (card.address)    lines.push(`ADR;TYPE=WORK:;;${escapeVCard(card.address)};;;;`)
  if (card.linkedin)   lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCard(card.linkedin)}`)
  if (card.facebook)   lines.push(`X-SOCIALPROFILE;TYPE=facebook:${escapeVCard(card.facebook)}`)
  if (card.twitter)    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${escapeVCard(card.twitter)}`)
  if (card.instagram)  lines.push(`X-SOCIALPROFILE;TYPE=instagram:${escapeVCard(card.instagram)}`)
  if (card.bio)        lines.push(`NOTE:${escapeVCard(card.bio)}`)

  // ✅ Photo en base64
  if (card.avatar_url) {
    try {
      const avatar = new URL(card.avatar_url)
      const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
      if (avatar.origin !== storage.origin || !avatar.pathname.startsWith('/storage/v1/object/public/avatars/')) {
        throw new Error('Unsupported avatar origin')
      }
      const imgRes = await fetch(avatar, { redirect: 'error', signal: AbortSignal.timeout(5000) })
      const mime = imgRes.headers.get('content-type')?.split(';')[0] || ''
      if (!imgRes.ok || !['image/png','image/jpeg','image/webp'].includes(mime) || Number(imgRes.headers.get('content-length')) > 5242880) throw new Error('Invalid avatar')
      const imgBuffer = await imgRes.arrayBuffer()
      if (imgBuffer.byteLength > 5242880) throw new Error('Avatar too large')
      const base64 = Buffer.from(imgBuffer).toString('base64')
      const type = mime.split('/')[1].toUpperCase()
      lines.push(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`)
    } catch { /* The contact remains downloadable if its optional photo is unavailable. */ }
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
