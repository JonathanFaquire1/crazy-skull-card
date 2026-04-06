export default function DashboardCard() {
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>
        ✅ Route NFC fonctionne !
      </h1>
      <p>Tu arrives ici après scan d'un SKU "claimed"</p>
      <p>Prochaines étapes : formulaire + vcf</p>
    </div>
  )
}