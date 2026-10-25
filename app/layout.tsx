'use client'

import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <div role="status" style={{ position: 'sticky', top: 0, zIndex: 9999, padding: '8px', textAlign: 'center', background: '#ffd166', color: '#111', fontSize: '13px' }}>
          DÉVELOPPEMENT — données de test uniquement
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="skull-theme"
          themes={['dark', 'light']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
