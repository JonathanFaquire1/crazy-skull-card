const { assertDevelopmentTarget, development } = require('./config/development.cjs')
assertDevelopmentTarget(process.env)
const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

/** @type {import('next').NextConfig} */
module.exports = {
  // Override inherited Vercel variables with this isolated project's public configuration.
  env: {
    NEXT_PUBLIC_APP_ENV: 'development',
    NEXT_PUBLIC_SUPABASE_URL: development.supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: development.publishableKey,
    NEXT_PUBLIC_APP_URL: appUrl,
    NEXT_PUBLIC_BASE_URL: appUrl,
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      { key: 'X-Crazy-Skull-Environment', value: 'development' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
    ] }]
  },
}
