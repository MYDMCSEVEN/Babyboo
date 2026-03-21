'use client'

import { useState, useMemo } from 'react'
import { getProducts } from '@/lib/products'
import ProductCard from '@/components/ProductCard'

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'category'

const sortLabels: Record<SortKey, string> = {
  'name': 'Nom (A-Z)',
  'price-asc': 'Prix croissant',
  'price-desc': 'Prix décroissant',
  'category': 'Catégorie',
}

export default function BoutiquePage() {
  const allProducts = getProducts()
  const categories = [...new Set(allProducts.map((p) => p.category))]

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')

  const filteredAndSorted = useMemo(() => {
    let products = selectedCategory === 'all'
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory)

    switch (sortBy) {
      case 'name':
        return [...products].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      case 'price-asc':
        return [...products].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...products].sort((a, b) => b.price - a.price)
      case 'category':
        return [...products].sort((a, b) => a.category.localeCompare(b.category, 'fr'))
      default:
        return products
    }
  }, [allProducts, selectedCategory, sortBy])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl text-baby-text mb-4">Notre Boutique</h1>
        <p className="text-baby-text/60 max-w-2xl mx-auto">
          Tous nos produits sont faits main en Suisse, personnalisables et créés avec des matériaux sûrs pour bébé.
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-medium text-baby-text/50 mb-1">Catégorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-baby-brown/20 text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="capitalize">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-baby-text/50 mb-1">Trier par</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="w-full px-3 py-2 rounded-lg border border-baby-brown/20 text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          >
            {Object.entries(sortLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <p className="text-sm text-baby-text/50 py-2">{filteredAndSorted.length} produit{filteredAndSorted.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSorted.map((product) => (
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

      {filteredAndSorted.length === 0 && (
        <div className="text-center py-16">
          <p className="text-baby-text/50 text-lg">Aucun produit trouvé dans cette catégorie</p>
        </div>
      )}
    </div>
  )
}
