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
  category: string
  inStock: boolean
  featured: boolean
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'accessoires',
    image: '/images/placeholder.jpg',
    images: '[]',
    inStock: true,
    featured: false,
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
    } catch (error) {
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
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      images: product.images,
      inStock: product.inStock,
      featured: product.featured,
    })
  }

  const startCreate = () => {
    setEditing(null)
    setCreating(true)
    setForm({
      name: '',
      description: '',
      price: '',
      category: 'accessoires',
      image: '/images/placeholder.jpg',
      images: '[]',
      inStock: true,
      featured: false,
    })
  }

  const handleSave = async () => {
    if (editing) {
      await fetch(`/api/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="font-serif text-xl text-baby-text font-bold">🧸 Admin Babyboo</h1>
            <nav className="flex space-x-4">
              <Link href="/admin/products" className="text-baby-rose font-semibold">
                Produits
              </Link>
              <Link href="/admin/orders" className="text-baby-text/60 hover:text-baby-text">
                Commandes
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm text-baby-text/60 hover:text-baby-text">
              Voir le site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-serif text-baby-text">
            Produits ({products.length})
          </h2>
          <button onClick={startCreate} className="btn-primary">
            + Nouveau produit
          </button>
        </div>

        {/* Edit/Create Form */}
        {(editing || creating) && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h3 className="font-serif text-xl text-baby-text mb-6">
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

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                    >
                      <option value="accessoires">Accessoires</option>
                      <option value="jouets">Jouets</option>
                      <option value="coffrets">Coffrets</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-6">
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
                    <span className="text-sm">Mis en avant</span>
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

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Image</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Produit</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Prix</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Catégorie</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
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
                    <span className="px-2 py-1 bg-baby-beige rounded-full text-xs capitalize">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.inStock ? 'En stock' : 'Épuisé'}
                    </span>
                    {product.featured && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        Vedette
                      </span>
                    )}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
