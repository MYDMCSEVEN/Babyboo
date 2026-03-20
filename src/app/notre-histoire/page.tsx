export default function NotreHistoirePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-baby-text mb-4">Notre Histoire</h1>
        <p className="text-baby-text/60">Deux soeurs, une passion</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm space-y-6 text-baby-text/80 leading-relaxed">
          <p className="text-xl font-serif text-baby-text">
            Nous sommes M & M, deux soeurs devenues mamans presque en même temps.
          </p>

          <p>
            Quand nos bébés sont arrivés, nous cherchions des accessoires uniques, sûrs et
            beaux pour eux. Ne trouvant pas exactement ce que nous voulions dans le commerce,
            nous avons décidé de les créer nous-mêmes.
          </p>

          <p>
            Ce qui a commencé comme un hobby est vite devenu une passion. Nos premières
            attache-lolettes et hochets ont tellement plu à notre entourage que nous avons
            décidé de partager nos créations avec d&apos;autres parents.
          </p>

          <p>
            Aujourd&apos;hui, <strong>Babyboo Création</strong> propose une gamme d&apos;accessoires
            faits main pour bébés et leurs parents. Chaque pièce est unique, personnalisable
            et fabriquée avec des matériaux soigneusement sélectionnés.
          </p>

          <div className="bg-baby-beige rounded-xl p-6 my-8">
            <h3 className="font-serif text-xl text-baby-text mb-4">Nos valeurs</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <span className="text-xl">💝</span>
                <span><strong>Fait avec amour</strong> — Chaque pièce est créée à la main avec soin et attention</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-xl">🇨🇭</span>
                <span><strong>Made in Switzerland</strong> — Nous travaillons depuis la Suisse avec des matériaux locaux</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-xl">🌿</span>
                <span><strong>Sécurité d&apos;abord</strong> — Bois naturel et silicone alimentaire, sans substances nocives</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-xl">✨</span>
                <span><strong>Unique et personnalisé</strong> — Chaque création peut être adaptée selon vos envies</span>
              </li>
            </ul>
          </div>

          <p>
            Merci de nous faire confiance pour accompagner les premiers moments de vie de
            vos petits bouts. Chaque commande est préparée avec le même amour que nous
            mettons dans les créations pour nos propres enfants.
          </p>

          <p className="text-center font-serif text-xl text-baby-rose">
            M & M ♡
          </p>
        </div>
      </div>
    </div>
  )
}
