// Integration checks against the dedicated Dev project. Credentials stay outside the repository.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createClient } = require('@supabase/supabase-js')
const { development } = require('../config/development.cjs')
assert.equal(development.projectRef, 'epoffgdhajtdvkvlreae')
const fixtures = JSON.parse(fs.readFileSync(process.env.CSC_TEST_FIXTURES, 'utf8'))
const checks = []
const check = name => { checks.push(name); console.log('PASS '+name) }
const client = () => createClient(development.supabaseUrl, development.publishableKey, {auth:{persistSession:false,autoRefreshToken:false}})
async function run() {
  const [owner,other,admin] = [client(),client(),client()]
  for (const [i,c] of [owner,other,admin].entries()) {
    const u=fixtures.users[i]; const {error}=await c.auth.signInWithPassword({email:u.email,password:u.password}); assert.ifError(error)
  }
  check('Connexion réelle Auth des trois comptes fictifs')
  const anon=client()
  assert.ok((await anon.rpc('claim_nfc_token',{p_code:'SKU99001'})).error)
  check('Réservation refusée sans authentification')
  let r=await owner.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.needs_card,true)
  r=await other.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.success,false)
  check('Réservation exclusive avant création de carte')
  const slug=`test-dev-${fixtures.run}`
  r=await owner.from('cards').insert({user_id:fixtures.users[0].id,slug,firstname:'Test',lastname:'Développement',bio:'Données entièrement fictives',color_accent:'#cc0000',email:'test@example.invalid'}).select().single(); assert.ifError(r.error); const card=r.data
  r=await owner.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.card_id,card.id); assert.equal(r.data.needs_card,false)
  r=await owner.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.card_id,card.id)
  check('Création, rattachement NFC et répétition sans doublon')
  assert.ok((await owner.from('nfc_tokens').update({user_id:fixtures.users[1].id}).eq('code','SKU99001')).error)
  r=await other.from('cards').update({firstname:'Intrusion'}).eq('id',card.id).select(); assert.ifError(r.error); assert.equal(r.data.length,0)
  assert.ok((await owner.from('profiles').update({role:'admin'}).eq('id',fixtures.users[0].id)).error)
  check('Modification du propriétaire NFC, carte tierce et élévation de rôle refusées')
  const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1kAAAAASUVORK5CYII=','base64')
  const path=fixtures.users[0].id+'/test.png'
  r=await owner.storage.from('avatars').upload(path,image,{contentType:'image/png',upsert:true}); assert.ifError(r.error)
  r=await owner.storage.from('avatars').upload(path,image,{contentType:'image/png',upsert:true}); assert.ifError(r.error)
  assert.ok((await other.storage.from('avatars').upload(path,image,{contentType:'image/png',upsert:true})).error)
  const avatar=owner.storage.from('avatars').getPublicUrl(path).data.publicUrl
  r=await owner.from('cards').update({avatar_url:avatar}).eq('id',card.id); assert.ifError(r.error)
  check('Upload et remplacement avatar autorisés au seul propriétaire')
  r=await anon.rpc('increment_scan',{card_slug:slug}); assert.ifError(r.error)
  r=await anon.rpc('increment_save',{card_slug:slug}); assert.ifError(r.error)
  r=await owner.from('cards').select('scan_count,save_count').eq('id',card.id).single(); assert.ifError(r.error); assert.equal(r.data.scan_count,1); assert.equal(r.data.save_count,1)
  check('Compteurs publics sans droit de modification des cartes')
  assert.ok((await owner.rpc('reset_nfc_token',{p_code:'SKU99001'})).error)
  r=await admin.rpc('reset_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error)
  r=await other.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.success,true)
  r=await admin.rpc('reset_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error)
  r=await owner.rpc('claim_nfc_token',{p_code:'SKU99001'}); assert.ifError(r.error); assert.equal(r.data.card_id,card.id)
  check('Réinitialisation réservée à l’administrateur et nouvelle réservation')
  const base=process.env.CSC_TEST_APP_URL || 'http://127.0.0.1:3000'
  assert.ok(base.startsWith('http://127.0.0.1:') || base.includes('-git-development-'))
  let response=await fetch(base+'/api/vcf/'+slug); assert.equal(response.status,200); const vcf=await response.text(); assert.ok(vcf.includes('BEGIN:VCARD')); assert.ok(vcf.includes('PHOTO;ENCODING=b')); assert.ok(!vcf.includes('crazyskullcards.fr/card/'))
  response=await fetch(base+'/api/qr/'+slug); assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'image/png')
  response=await fetch(base+'/nfc/SKU99001',{redirect:'manual'}); assert.ok([303,307,308].includes(response.status)); assert.equal(new URL(response.headers.get('location'),base).pathname,'/card/'+slug)
  response=await fetch(base+'/api/scan/'+slug,{method:'POST'}); assert.equal(response.status,200)
  check('API vCard avec photo, QR PNG, redirection NFC et scan HTTP')
  await owner.from('cards').update({is_active:false}).eq('id',card.id)
  response=await fetch(base+'/api/vcf/'+slug); assert.equal(response.status,404)
  response=await fetch(base+'/api/scan/'+slug,{method:'POST'}); assert.equal(response.status,404)
  await owner.from('cards').update({is_active:true}).eq('id',card.id)
  check('Carte désactivée indisponible aux API publiques')
  for(const c of [owner,other,admin]) await c.auth.signOut()
  fs.writeFileSync(process.env.CSC_TEST_REPORT,JSON.stringify({projectRef:development.projectRef,run:fixtures.run,slug,checks,passed:checks.length},null,2))
}
run().catch(error=>{ console.error(error.message);process.exitCode=1 })
