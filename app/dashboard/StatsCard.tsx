'use client'

import { useTheme } from 'next-themes'

type Props = {
  totalViews: number
  viewsThisWeek: number
  viewsToday: number
  slug: string
}

export default function StatsCard({ totalViews, viewsThisWeek, viewsToday, slug }: Props) {
  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'
  const panel = isLight ? '#f5f5f5' : '#161616'
  const border = isLight ? '#e5e5e5' : '#2a2a2a'
  const muted = isLight ? '#666' : '#9a9080'

  return (
    <div style={{
      background: panel,
      border: `1px solid ${border}`,
      borderRadius: '4px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      <div style={{
        fontFamily: "'Bebas Neue',sans-serif",
        fontSize: '16px',
        letterSpacing: '3px',
        marginBottom: '16px',
        color: '#cc0000',
      }}>
        STATISTIQUES DE LA CARTE
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
      }}>
        {[
          { label: "AUJOURD'HUI", value: viewsToday },
          { label: 'CETTE SEMAINE', value: viewsThisWeek },
          { label: 'TOTAL', value: totalViews },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: isLight ? '#fff' : '#0a0a0a',
            border: `1px solid ${border}`,
            borderRadius: '4px',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '32px',
              fontFamily: "'Bebas Neue',sans-serif",
              color: '#cc0000',
              lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono',monospace",
              color: muted,
              letterSpacing: '2px',
              marginTop: '6px',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}