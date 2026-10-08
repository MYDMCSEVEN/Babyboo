'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PasswordInput from '@/components/PasswordInput'

const inputClass = 'w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la réinitialisation')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/compte'), 3000)
    } catch {
      setError('Erreur lors de la réinitialisation')
    }

    setLoading(false)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-baby-cream py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl text-baby-text mb-4">Lien invalide</h1>
          <p className="text-baby-text/60 mb-6">Ce lien de réinitialisation n&apos;est pas valide.</p>
          <a href="/compte" className="btn-primary inline-block">Retour à la connexion</a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-baby-cream py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="font-serif text-2xl text-baby-text mb-2">Mot de passe modifié</h1>
            <p className="text-baby-text/60 mb-4">Votre mot de passe a été réinitialisé avec succès.</p>
            <p className="text-sm text-baby-text/40">Redirection vers la connexion...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-baby-cream py-12">
      <div className="max-w-md mx-auto px-4">
        <h1 className="font-serif text-3xl text-baby-text text-center mb-8">Nouveau mot de passe</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Nouveau mot de passe</label>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Confirmer le mot de passe</label>
            <PasswordInput
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-baby-cream">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
