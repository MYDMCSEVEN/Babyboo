'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function AdminLoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push('/admin/products')
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/admin/products')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-baby-cream px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-4xl">🔐</span>
          <h1 className="font-serif text-2xl text-baby-text mt-4">Administration</h1>
          <p className="text-baby-text/60 mt-2">Babyboo Créations</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
              placeholder="admin@babyboo.ch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
