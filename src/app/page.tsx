import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import HeroCarousel from '@/components/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const featuredProducts = getFeaturedProducts().slice(0, 4)

  return (
    <div>
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Trust badges */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl mb-2">🇨🇭</div>
            <p className="text-sm text-baby-text/70">Fait en Suisse</p>
          </div>
          <div>
            <div className="text-3xl mb-2">✋</div>
            <p className="text-sm text-baby-text/70">100% fait main</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🌿</div>
            <p className="text-sm text-baby-text/70">Matériaux sûrs</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💝</div>
            <p className="text-sm text-baby-text/70">Personnalisable</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 md:gap-6 mb-4">
            <Image
              src="/images/logo-saumon.png"
              alt="Babyboo Créations"
              width={160}
              height={160}
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32"
            />
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text">Nos créations populaires</h2>
          </div>
          <p className="text-baby-text/60">Découvrez nos accessoires les plus appréciés</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              image={product.image}
              category={product.category}
            />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/boutique" className="btn-primary">
            Voir tous nos produits
          </Link>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-baby-beige py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-baby-text mb-6">Créé par deux soeurs, pour vos petits</h2>
          <p className="text-baby-text/70 text-lg leading-relaxed mb-8">
            Tout a commencé quand nous sommes devenues mamans. Nous voulions des accessoires
            uniques et sûrs pour nos bébés. Ne trouvant pas exactement ce que nous cherchions,
            nous avons commencé à les créer nous-mêmes. Aujourd&apos;hui, nous partageons nos
            créations avec vous, toujours fabriquées avec le même amour et la même attention
            aux détails.
          </p>
          <Link href="/notre-histoire" className="text-baby-rose font-semibold hover:underline">
            En savoir plus sur notre histoire →
          </Link>
        </div>
      </section>

      {/* Materials */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-serif text-3xl text-baby-text text-center mb-12">Des matériaux sûrs pour bébé</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="font-serif text-xl text-baby-text mb-3">🪵 Bois naturel</h3>
            <p className="text-baby-text/70">
              Nous utilisons du bois naturel non traité, sûr pour bébé et respectueux de
              l&apos;environnement. Chaque perle est soigneusement poncée pour un toucher doux.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="font-serif text-xl text-baby-text mb-3">🫧 Silicone alimentaire</h3>
            <p className="text-baby-text/70">
              Notre silicone est de qualité alimentaire, sans BPA, non toxique. Les bébés
              peuvent le mettre en bouche en toute sécurité.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
