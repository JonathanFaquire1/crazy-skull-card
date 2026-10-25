const assert=require('node:assert/strict')
const fs=require('node:fs')
const {createClient}=require('@supabase/supabase-js')
const {development}=require('../config/development.cjs')
assert.equal(development.projectRef,'epoffgdhajtdvkvlreae')
const fixtures=JSON.parse(fs.readFileSync(process.env.CSC_TEST_FIXTURES,'utf8'))
async function run(){
 const clients=fixtures.users.slice(0,2).map(()=>createClient(development.supabaseUrl,development.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}))
 for(const [i,c] of clients.entries()) assert.ifError((await c.auth.signInWithPassword({email:fixtures.users[i].email,password:fixtures.users[i].password})).error)
 const results=await Promise.all(clients.map(c=>c.rpc('claim_nfc_token',{p_code:'SKU99003'})))
 results.forEach(r=>assert.ifError(r.error))
 assert.equal(results.filter(r=>r.data.success).length,1)
 // Remove only the synthetic avatar belonging to this run.
 assert.ifError((await clients[0].storage.from('avatars').remove([fixtures.users[0].id+'/test.png'])).error)
 for(const c of clients) await c.auth.signOut()
 const report=JSON.parse(fs.readFileSync(process.env.CSC_TEST_REPORT,'utf8'))
 report.checks.push('Deux réservations concurrentes : un seul propriétaire accepté')
 report.checks.push('Suppression de l’avatar fictif par son propriétaire')
 report.passed=report.checks.length
 fs.writeFileSync(process.env.CSC_TEST_REPORT,JSON.stringify(report,null,2))
 console.log('PASS concurrence NFC : un seul compte accepté ; avatar fictif supprimé')
}
run().catch(e=>{console.error(e.message);process.exitCode=1})
