'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-baby-text mb-4">Contact</h1>
        <p className="text-baby-text/60">Une question ? N&apos;hésitez pas à nous écrire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="font-serif text-xl text-baby-text mb-6">Nos coordonnées</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="font-semibold">Email</p>
                <a href="mailto:info@babyboo-creations.ch" className="text-baby-rose hover:underline">
                  info@babyboo-creations.ch
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="font-semibold">Téléphone</p>
                <a href="tel:+41792704101" className="text-baby-rose hover:underline">
                  079 270 41 01
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-xl">📸</span>
              <div>
                <p className="font-semibold">Instagram</p>
                <a
                  href="https://www.instagram.com/babyboo.creationss/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-baby-rose hover:underline"
                >
                  @babyboo.creationss
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="font-semibold">Retrait</p>
                <p className="text-baby-text/70">Suisse uniquement</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-baby-beige rounded-xl">
            <p className="text-sm text-baby-text/70">
              <strong>Service après-vente :</strong> Si un produit présente un défaut,
              envoyez-nous une photo par email. Nous examinerons chaque situation au cas
              par cas et ferons notre possible pour vous aider (réparation, remplacement du cordon, etc.).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="font-serif text-xl text-baby-text mb-6">Envoyez-nous un message</h2>

          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✉️</div>
              <p className="text-baby-text font-semibold">Message envoyé !</p>
              <p className="text-baby-text/60 mt-2">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Nom</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
