'use client'

import Image from 'next/image'
import Link from 'next/link'
import { addToCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category: string
}

export default function ProductCard({ id, name, slug, price, image, category }: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({ id, name, price, image })
  }

  return (
    <Link href={`/boutique/${slug}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative aspect-square bg-baby-beige">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-3 left-3 bg-white/90 text-baby-text text-xs px-3 py-1 rounded-full">
            {category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-serif text-baby-text font-semibold mb-1">{name}</h3>
          <div className="flex justify-between items-center">
            <p className="text-baby-brown font-bold">{formatPrice(price)}</p>
            <button
              onClick={handleAddToCart}
              className="bg-baby-rose text-white px-4 py-2 rounded-full text-sm hover:bg-baby-rose/80 transition"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
