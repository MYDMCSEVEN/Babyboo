'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [consent, setConsent] = useState(false)
  const [subject, setSubject] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) return
    setSent(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-baby-text mb-2 sm:mb-4">Contact</h1>
        <p className="text-baby-text/60 text-sm sm:text-base">Une question ? N&apos;hésitez pas à nous écrire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
          <h2 className="font-serif text-lg sm:text-xl text-baby-text mb-4 sm:mb-6">Nos coordonnées</h2>

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
                <a href="tel:+41792704105" className="text-baby-rose hover:underline">
                  079 270 41 05
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

          {/* WhatsApp CTA button */}
          <a
            href="https://wa.me/41792704105"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-full transition shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Nous écrire sur WhatsApp
          </a>

          <div className="mt-6 p-4 bg-baby-beige rounded-xl">
            <p className="text-sm text-baby-text/70">
              <strong>Service après-vente :</strong> Si un produit présente un défaut,
              envoyez-nous une photo par email. Nous examinerons chaque situation au cas
              par cas et ferons notre possible pour vous aider (réparation, remplacement du cordon, etc.).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
          <h2 className="font-serif text-lg sm:text-xl text-baby-text mb-4 sm:mb-6">Envoyez-nous un message</h2>

          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✉️</div>
              <p className="text-baby-text font-semibold">Message envoyé !</p>
              <p className="text-baby-text/60 mt-2">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  autoComplete="name"
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  autoComplete="email"
                  pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                  title="Entrez une adresse email valide (ex: nom@exemple.ch)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Téléphone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+41 79 123 45 67"
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  autoComplete="tel"
                  inputMode="tel"
                  pattern="[\+]?[0-9\s\-()]{7,}"
                  title="Entrez un numéro de téléphone valide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Sujet *</label>
                <select
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50 text-baby-text"
                >
                  <option value="" disabled>Choisissez un sujet...</option>
                  <option value="commande-speciale">Commande spéciale</option>
                  <option value="retour-marchandise">Retour de marchandise</option>
                  <option value="question-produit">Question sur un produit</option>
                  <option value="suivi-commande">Suivi de commande</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              {(subject === 'retour-marchandise' || subject === 'suivi-commande') && (
                <div>
                  <label className="block text-sm font-medium text-baby-text mb-1">Numéro de commande *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: abc123"
                    className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Message *</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                />
              </div>

              {/* Consent checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 rounded border-baby-brown/30 text-baby-rose focus:ring-baby-rose/50"
                  required
                />
                <label htmlFor="consent" className="text-xs text-baby-text/60 leading-relaxed">
                  J&apos;accepte que mes données personnelles (nom, email, téléphone) soient utilisées pour
                  traiter ma demande. Elles ne seront pas partagées avec des tiers et seront
                  conservées uniquement le temps nécessaire au traitement de ma requête.
                  Consultez nos{' '}
                  <a href="/mentions-legales" className="text-baby-rose hover:underline">
                    mentions légales
                  </a>{' '}
                  pour plus d&apos;informations.
                </label>
              </div>

              <button
                type="submit"
                disabled={!consent}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Envoyer
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
