import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Notre Histoire',
  description: 'Découvrez l\'histoire de Babyboo Créations : deux soeurs suisses qui créent des accessoires uniques pour bébés, faits main avec amour.',
}

export default function NotreHistoirePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero section with background photo */}
      <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          src="/images/babies-twins-2.jpg"
          alt="Deux bébés jouant avec des accessoires Babyboo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-baby-beige" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <Image
            src="/images/logo-saumon.png"
            alt="Babyboo Créations"
            width={240}
            height={240}
            className="w-20 h-20 sm:w-32 sm:h-32 md:w-44 md:h-44 mb-3 sm:mb-4 drop-shadow-lg"
          />
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3 drop-shadow-lg">Notre Histoire</h1>
          <p className="text-white/80 text-base sm:text-lg drop-shadow-md">Deux soeurs, une passion</p>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12 -mt-8 sm:-mt-12">
        <div className="prose prose-lg max-w-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 sm:p-8 md:p-12 shadow-lg space-y-4 sm:space-y-6 text-baby-text/80 leading-relaxed text-sm sm:text-base">
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
              Aujourd&apos;hui, <strong>Babyboo Créations</strong> propose une gamme d&apos;accessoires
              faits main pour bébés et leurs parents. Chaque pièce est unique, personnalisable
              et fabriquée avec des matériaux soigneusement sélectionnés.
            </p>

            <div className="bg-baby-beige/70 rounded-xl p-6 my-8">
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
    </div>
  )
}
