const assert = require('node:assert/strict')
const { development, assertDevelopmentTarget } = require('../config/development.cjs')
assertDevelopmentTarget({})
assertDevelopmentTarget({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'development' })
assert.throws(() => assertDevelopmentTarget({ VERCEL_ENV: 'production' }))
assert.throws(() => assertDevelopmentTarget({ VERCEL_TARGET_ENV: 'production' }))
assert.throws(() => assertDevelopmentTarget({ VERCEL_GIT_COMMIT_REF: 'master' }))
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://oozzpzjolbybgovzyzla.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'inherited-production-value'
const config = require('../next.config.js')
assert.equal(config.env.NEXT_PUBLIC_SUPABASE_URL, development.supabaseUrl)
assert.equal(config.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, development.publishableKey)
assert.equal(config.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000')
console.log('Isolation checks passed: production targets rejected; inherited database configuration overridden.')
