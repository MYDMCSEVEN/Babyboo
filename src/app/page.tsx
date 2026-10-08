import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedProductsFromDB } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import HeroCarousel from '@/components/HeroCarousel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const featuredProducts = (await getFeaturedProductsFromDB()).slice(0, 4)

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
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 md:gap-6 mb-3 sm:mb-4">
            <Image
              src="/images/logo-saumon.png"
              alt="Babyboo Créations"
              width={320}
              height={320}
              className="w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 lg:w-56 lg:h-56"
            />
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text">Nos créations populaires</h2>
          </div>
          <p className="text-baby-text/60 text-sm sm:text-base">Découvrez nos accessoires les plus appréciés</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => {
            const cats: string[] = JSON.parse(product.categories)
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                image={product.image}
                category={cats[0] || ''}
                isNew={product.isNew}
              />
            )
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/boutique" className="btn-primary">
            Voir tous nos produits
          </Link>
        </div>
      </section>

      {/* Lifestyle photo section - twins with beads */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[500px]">
            <Image
              src="/images/babies-twins-1.jpg"
              alt="Bébés jumeaux avec des perles personnalisées LEO — Babyboo Créations"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="flex items-center justify-center bg-baby-beige px-5 sm:px-8 py-10 sm:py-12 md:py-0">
            <div className="max-w-md text-center md:text-left">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text mb-3 sm:mb-4">
                Des créations qui font sourire
              </h2>
              <p className="text-baby-text/70 text-base sm:text-lg leading-relaxed mb-5 sm:mb-6">
                Chaque perle est choisie avec soin, chaque prénom assemblé avec amour. Nos accessoires accompagnent les plus beaux moments de vos petits.
              </p>
              <Link
                href="/personnaliser"
                className="inline-flex items-center gap-2 bg-baby-rose text-white font-semibold px-8 py-3.5 rounded-full hover:bg-baby-rose/90 transition shadow-lg"
              >
                Personnaliser le vôtre ✨
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-baby-text mb-4 sm:mb-6">Créé par deux soeurs, pour vos petits</h2>
          <p className="text-baby-text/70 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
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

      {/* Second lifestyle photo - smiling twins */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="flex items-center justify-center bg-baby-cream px-5 sm:px-8 py-10 sm:py-12 md:py-0 order-2 md:order-1">
            <div className="max-w-md text-center md:text-left">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text mb-3 sm:mb-4">
                Le cadeau de naissance idéal
              </h2>
              <p className="text-baby-text/70 text-base sm:text-lg leading-relaxed mb-4">
                Offrez un cadeau unique et personnalisé. Nos coffrets sont parfaits pour célébrer une naissance, un baptême ou simplement faire plaisir.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center md:items-start">
                <Link
                  href="/boutique"
                  className="inline-flex items-center gap-2 bg-baby-brown text-white font-semibold px-8 py-3.5 rounded-full hover:bg-baby-brown/90 transition shadow-lg"
                >
                  Voir les coffrets 🎁
                </Link>
              </div>
            </div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[500px] order-1 md:order-2">
            <Image
              src="/images/babies-twins-2.jpg"
              alt="Bébés jumeaux souriants avec perles personnalisées — Babyboo Créations"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
        <h2 className="font-serif text-2xl sm:text-3xl text-baby-text text-center mb-8 sm:mb-12">Des matériaux sûrs pour bébé</h2>
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

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-baby-rose/20 via-baby-pink/30 to-baby-beige py-10 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text mb-3 sm:mb-4">
            Créez quelque chose d&apos;unique
          </h2>
          <p className="text-baby-text/70 text-base sm:text-lg mb-6 sm:mb-8">
            Choisissez chaque perle, chaque couleur, chaque forme. Votre création sera aussi unique que votre bébé.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/personnaliser"
              className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4"
            >
              Commencer la personnalisation ✨
            </Link>
            <Link
              href="/contact"
              className="btn-secondary text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
