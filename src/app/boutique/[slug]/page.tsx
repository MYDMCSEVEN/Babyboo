import type { Metadata } from 'next'
import { getProductBySlugFromDB } from '@/lib/products'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import AddToCartButton from './AddToCartButton'
import ProductCard from '@/components/ProductCard'
import { formatPrice } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlugFromDB(params.slug)
  if (!product) return { title: 'Produit non trouvé' }
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} | Babyboo Créations`,
      description: product.description,
      images: [{ url: product.image }],
    },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugFromDB(params.slug)

  if (!product) notFound()

  const images: string[] = product.images ? JSON.parse(product.images) : []
  const allImages = [product.image, ...images].filter(Boolean)
  const categories: string[] = JSON.parse(product.categories)

  // Get related products (same categories, exclude current)
  const allProducts = await prisma.product.findMany({
    where: {
      inStock: true,
      id: { not: product.id },
    },
  })

  const relatedProducts = allProducts
    .map((p) => {
      const pCats: string[] = JSON.parse(p.categories)
      const commonCats = pCats.filter((c) => categories.includes(c))
      return { ...p, relevance: commonCats.length }
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-baby-beige rounded-2xl overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.isNew && (
              <span className="absolute top-4 right-4 bg-baby-rose text-white text-sm font-bold px-4 py-1.5 rounded-full">
                NEW
              </span>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((img, i) => (
                <div key={i} className="relative aspect-square bg-baby-beige rounded-lg overflow-hidden">
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <span key={cat} className="text-baby-brown text-sm font-medium uppercase tracking-wide">
                {cat}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-baby-text mt-2 mb-3 sm:mb-4">{product.name}</h1>
          <p className="text-2xl sm:text-3xl text-baby-rose font-bold mb-4 sm:mb-6">{formatPrice(product.price)}</p>
          <p className="text-baby-text/70 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">{product.description}</p>

          <div className="space-y-3">
            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
            />
            <p className="text-center text-xs text-baby-text/40">Achat rapide — personnalisation au checkout</p>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-baby-brown/10" /></div>
              <span className="relative bg-white px-4 text-sm text-baby-text/40">ou</span>
            </div>

            <Link
              href={`/personnaliser?type=${product.slug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-baby-rose text-baby-rose font-semibold hover:bg-baby-rose hover:text-white transition text-center"
            >
              ✨ Composez-le vous-même
            </Link>
            <p className="text-center text-xs text-baby-text/40">Choisissez chaque perle, couleur et forme</p>
          </div>

          <div className="mt-8 space-y-4 border-t pt-8">
            <div className="flex items-start space-x-3">
              <span className="text-xl">🇨🇭</span>
              <div>
                <p className="font-semibold text-baby-text">Fait main en Suisse</p>
                <p className="text-sm text-baby-text/60">Chaque pièce est unique et créée avec soin</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-xl">🌿</span>
              <div>
                <p className="font-semibold text-baby-text">Matériaux sûrs</p>
                <p className="text-sm text-baby-text/60">Bois naturel et silicone alimentaire, sans BPA</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-xl">✨</span>
              <div>
                <p className="font-semibold text-baby-text">Personnalisable</p>
                <p className="text-sm text-baby-text/60">Ajoutez le prénom de bébé lors de la commande</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-baby-brown/10">
          <h2 className="font-serif text-2xl text-baby-text text-center mb-8">
            Vous aimerez aussi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((rp) => {
              const rpCats: string[] = JSON.parse(rp.categories)
              return (
                <ProductCard
                  key={rp.id}
                  id={rp.id}
                  name={rp.name}
                  slug={rp.slug}
                  price={rp.price}
                  image={rp.image}
                  category={rpCats[0] || ''}
                  isNew={rp.isNew}
                />
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/boutique" className="text-baby-rose font-semibold hover:underline">
              Voir tous nos produits →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
