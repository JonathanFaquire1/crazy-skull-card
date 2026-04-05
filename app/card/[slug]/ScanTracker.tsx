'use client'

import { useEffect } from 'react'

export default function ScanTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/scan/${slug}`, {
      method: 'POST',
      cache: 'no-store',
    }).catch((err) => {
      console.error('Erreur scan tracker:', err)
    })
  }, [slug])

  return null
}