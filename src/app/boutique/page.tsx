import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export default async function BoutiquePage() {
  const products = await prisma.product.findMany({
    where: { inStock: true },
    orderBy: { createdAt: 'desc' },
  })

  const categories = [...new Set(products.map((p) => p.category))]

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-baby-text mb-4">Notre Boutique</h1>
        <p className="text-baby-text/60 max-w-2xl mx-auto">
          Tous nos produits sont faits main en Suisse, personnalisables et créés avec des matériaux sûrs pour bébé.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-16">
          <h2 className="font-serif text-2xl text-baby-text mb-6 capitalize">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products
              .filter((p) => p.category === category)
              .map((product) => (
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
        </div>
      ))}
    </div>
  )
}
