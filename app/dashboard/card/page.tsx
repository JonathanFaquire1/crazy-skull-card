export default function DashboardCard() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Ma carte de visite</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <p>✅ Ta route NFC fonctionne !</p>
        <p>Tu arrives ici après scan d'un SKU "claimed"</p>
        <p>Prochaines étapes : formulaire de complétion + vcf</p>
      </div>
    </div>
  )
}