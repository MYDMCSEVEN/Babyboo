import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import AddToCartButton from './AddToCartButton'
import { formatPrice } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product) notFound()

  const images: string[] = product.images ? JSON.parse(product.images) : []
  const allImages = [product.image, ...images].filter(Boolean)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
          <span className="text-baby-brown text-sm font-medium uppercase tracking-wide">
            {product.category}
          </span>
          <h1 className="font-serif text-3xl text-baby-text mt-2 mb-4">{product.name}</h1>
          <p className="text-3xl text-baby-rose font-bold mb-6">{formatPrice(product.price)}</p>
          <p className="text-baby-text/70 leading-relaxed mb-8">{product.description}</p>

          <AddToCartButton
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
          />

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
    </div>
  )
}
