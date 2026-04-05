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