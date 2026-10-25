// Public browser configuration only. Never put a service_role key here.
const development = Object.freeze({
  projectRef: 'epoffgdhajtdvkvlreae',
  supabaseUrl: 'https://epoffgdhajtdvkvlreae.supabase.co',
  publishableKey: 'sb_publishable_NmBr98cwcdHOi1zICxGfYg_ZX3P8YTG',
})
function assertDevelopmentTarget(env) {
  if (env.VERCEL_ENV === 'production' || env.VERCEL_TARGET_ENV === 'production') {
    throw new Error('Development branch: production deployment is forbidden.')
  }
  if (env.VERCEL_GIT_COMMIT_REF && env.VERCEL_GIT_COMMIT_REF !== 'development') {
    throw new Error('This configuration may only deploy the development branch.')
  }
  if (development.supabaseUrl !== `https://${development.projectRef}.supabase.co` ||
      development.projectRef === 'oozzpzjolbybgovzyzla' ||
      !development.publishableKey.startsWith('sb_publishable_')) {
    throw new Error('Invalid isolated development database configuration.')
  }
}
module.exports = { development, assertDevelopmentTarget }
