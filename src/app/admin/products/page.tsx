'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  images: string
  categories: string
  inStock: boolean
  featured: boolean
  isNew: boolean
}

type SortKey = 'name' | 'price' | 'category'
type SortDir = 'asc' | 'desc'

const DEFAULT_CATEGORIES = ['accessoires', 'jouets', 'coffrets']

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterCategory, setFilterCategory] = useState('all')
  const [newCategory, setNewCategory] = useState('')

  // Gather all categories from products + defaults
  const allCategories = [...new Set([
    ...DEFAULT_CATEGORIES,
    ...products.flatMap(p => {
      try { return JSON.parse(p.categories) as string[] } catch { return [] }
    }),
  ])].sort()

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedProducts = [...products]
    .filter(p => {
      if (filterCategory === 'all') return true
      try {
        const cats: string[] = JSON.parse(p.categories)
        return cats.includes(filterCategory)
      } catch { return false }
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'name': return dir * a.name.localeCompare(b.name, 'fr')
        case 'price': return dir * (a.price - b.price)
        case 'category': return dir * a.categories.localeCompare(b.categories, 'fr')
        default: return 0
      }
    })

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categories: [] as string[],
    image: '/images/placeholder.jpg',
    images: '[]',
    inStock: true,
    featured: false,
    isNew: false,
  })

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin')
    if (status === 'authenticated') fetchProducts()
  }, [status, router, fetchProducts])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setForm((prev) => ({ ...prev, image: data.url }))
      }
    } catch {
      alert('Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const handleAdditionalImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const urls: string[] = JSON.parse(form.images)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (data.url) urls.push(data.url)
      } catch {}
    }

    setForm((prev) => ({ ...prev, images: JSON.stringify(urls) }))
    setUploading(false)
  }

  const startEdit = (product: Product) => {
    setEditing(product)
    setCreating(false)
    let cats: string[] = []
    try { cats = JSON.parse(product.categories) } catch {}
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categories: cats,
      image: product.image,
      images: product.images,
      inStock: product.inStock,
      featured: product.featured,
      isNew: product.isNew,
    })
  }

  const startCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      name: '',
      description: '',
      price: '',
      categories: ['accessoires'],
      image: '/images/placeholder.jpg',
      images: '[]',
      inStock: true,
      featured: false,
      isNew: true,
    })
  }

  const handleSave = async () => {
    const payload = {
      ...form,
      categories: JSON.stringify(form.categories),
    }

    if (editing) {
      await fetch(`/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setEditing(null)
    setCreating(false)
    fetchProducts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const toggleField = async (product: Product, field: 'inStock' | 'featured' | 'isNew') => {
    const updated = { ...product, [field]: !product[field] }
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updated.name,
        description: updated.description,
        price: updated.price,
        categories: updated.categories,
        image: updated.image,
        images: updated.images,
        inStock: updated.inStock,
        featured: updated.featured,
        isNew: updated.isNew,
      }),
    })
    fetchProducts()
  }

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  const addNewCategory = () => {
    const cat = newCategory.trim().toLowerCase()
    if (cat && !form.categories.includes(cat)) {
      setForm(prev => ({ ...prev, categories: [...prev.categories, cat] }))
      setNewCategory('')
    }
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6">
            <h1 className="font-serif text-base sm:text-xl text-baby-text font-bold">Admin</h1>
            <nav className="flex gap-2 sm:gap-4">
              <Link href="/admin/products" className="text-xs sm:text-sm text-baby-rose font-semibold">
                Produits
              </Link>
              <Link href="/admin/orders" className="text-xs sm:text-sm text-baby-text/60 hover:text-baby-text">
                Commandes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-xs sm:text-sm text-baby-text/60 hover:text-baby-text">
              Site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-xs sm:text-sm text-red-500 hover:text-red-700"
            >
              Déco.
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-serif text-baby-text">
            Produits ({products.length})
          </h2>
          <button onClick={startCreate} className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
            + Nouveau
          </button>
        </div>

        {/* Edit/Create Form */}
        {(editing || creating) && (
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-8">
            <h3 className="font-serif text-base sm:text-xl text-baby-text mb-4 sm:mb-6">
              {editing ? `Modifier : ${editing.name}` : 'Nouveau produit'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (CHF)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégories</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {allCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          form.categories.includes(cat)
                            ? 'bg-baby-rose text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewCategory())}
                      placeholder="Nouvelle catégorie..."
                      className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                    />
                    <button
                      type="button"
                      onClick={addNewCategory}
                      className="px-4 py-1.5 bg-baby-beige text-baby-text rounded-lg text-sm hover:bg-baby-beige/80 transition"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">En stock</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Vedette</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.isNew}
                      onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-baby-rose">NEW</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image principale</label>
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <Image src={form.image} alt="Preview" fill className="object-cover" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm"
                  />
                  {uploading && <p className="text-sm text-baby-rose mt-1">Téléchargement...</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images supplémentaires</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImages}
                    className="text-sm"
                  />
                  {JSON.parse(form.images).length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {JSON.parse(form.images).map((url: string, i: number) => (
                        <div key={i} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                          <Image src={url} alt={`Extra ${i}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button onClick={handleSave} className="btn-primary">
                {editing ? 'Enregistrer' : 'Créer le produit'}
              </button>
              <button
                onClick={() => { setEditing(null); setCreating(false) }}
                className="px-6 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-gray-400 mb-1">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
            >
              <option value="all">Toutes</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs sm:text-sm text-gray-400 py-1 sm:py-2">{sortedProducts.length} produit{sortedProducts.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Sort buttons (mobile) */}
        <div className="flex gap-1.5 mb-3 sm:hidden overflow-x-auto">
          <button onClick={() => toggleSort('name')} className="px-2.5 py-1.5 rounded-lg border text-[10px] font-medium bg-white whitespace-nowrap">
            Nom{sortIcon('name')}
          </button>
          <button onClick={() => toggleSort('price')} className="px-2.5 py-1.5 rounded-lg border text-[10px] font-medium bg-white whitespace-nowrap">
            Prix{sortIcon('price')}
          </button>
          <button onClick={() => toggleSort('category')} className="px-2.5 py-1.5 rounded-lg border text-[10px] font-medium bg-white whitespace-nowrap">
            Catégorie{sortIcon('category')}
          </button>
        </div>

        {/* Products Table — Desktop */}
        <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-baby-text select-none" onClick={() => toggleSort('name')}>Produit{sortIcon('name')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-baby-text select-none" onClick={() => toggleSort('price')}>Prix{sortIcon('price')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 cursor-pointer hover:text-baby-text select-none" onClick={() => toggleSort('category')}>Catégories{sortIcon('category')}</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProducts.map((product) => {
                let cats: string[] = []
                try { cats = JSON.parse(product.categories) } catch {}
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-baby-text">{product.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold">{product.price.toFixed(2)} CHF</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {cats.map(cat => (
                          <span key={cat} className="px-2 py-1 bg-baby-beige rounded-full text-xs capitalize">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => toggleField(product, 'inStock')}
                          className={`px-2 py-1 rounded-full text-xs cursor-pointer transition ${
                            product.inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {product.inStock ? 'En stock' : 'Épuisé'}
                        </button>
                        <button
                          onClick={() => toggleField(product, 'featured')}
                          className={`px-2 py-1 rounded-full text-xs cursor-pointer transition ${
                            product.featured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {product.featured ? 'Vedette' : 'Normal'}
                        </button>
                        <button
                          onClick={() => toggleField(product, 'isNew')}
                          className={`px-2 py-1 rounded-full text-xs cursor-pointer transition ${
                            product.isNew ? 'bg-baby-rose text-white hover:bg-baby-rose/80' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          NEW
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="text-baby-rose hover:text-baby-rose/70 text-sm font-medium"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Products Cards — Mobile */}
        <div className="sm:hidden space-y-2">
          {sortedProducts.map((product) => {
            let cats: string[] = []
            try { cats = JSON.parse(product.categories) } catch {}
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-baby-text leading-tight">{product.name}</p>
                      <p className="font-bold text-sm text-baby-text shrink-0">{product.price.toFixed(2)} CHF</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cats.map(cat => (
                        <span key={cat} className="px-1.5 py-0.5 bg-baby-beige rounded-full text-[10px] capitalize">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Status toggles + Actions */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => toggleField(product, 'inStock')}
                      className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition ${
                        product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.inStock ? 'Stock' : 'Épuisé'}
                    </button>
                    <button
                      onClick={() => toggleField(product, 'featured')}
                      className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition ${
                        product.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {product.featured ? '⭐' : 'Normal'}
                    </button>
                    <button
                      onClick={() => toggleField(product, 'isNew')}
                      className={`px-2 py-0.5 rounded-full text-[10px] cursor-pointer transition ${
                        product.isNew ? 'bg-baby-rose text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      NEW
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(product)}
                      className="text-baby-rose text-xs font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 text-xs font-medium"
                    >
                      Suppr.
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
