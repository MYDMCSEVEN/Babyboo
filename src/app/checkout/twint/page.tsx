'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'

function TwintContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order') || ''

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-5xl mb-4">💳</div>
        <h1 className="font-serif text-2xl text-baby-text mb-2">Paiement par Twint</h1>
        <p className="text-baby-text/60 mb-8">Commande #{orderId.slice(-6)}</p>

        <div className="bg-baby-beige rounded-xl p-6 mb-6">
          <p className="text-sm text-baby-text/70 mb-3">Envoyez le montant via Twint au :</p>
          <p className="text-2xl font-bold text-baby-text mb-2">079 270 41 01</p>
          <p className="text-sm text-baby-text/70">
            Indiquez la référence <strong>#{orderId.slice(-6)}</strong> dans le message Twint.
          </p>
        </div>

        <div className="space-y-3 text-sm text-baby-text/70 text-left mb-8">
          <div className="flex items-start space-x-2">
            <span>1.</span>
            <span>Ouvrez votre application Twint</span>
          </div>
          <div className="flex items-start space-x-2">
            <span>2.</span>
            <span>Envoyez le montant au <strong>079 270 41 01</strong></span>
          </div>
          <div className="flex items-start space-x-2">
            <span>3.</span>
            <span>Ajoutez la référence <strong>#{orderId.slice(-6)}</strong> dans le message</span>
          </div>
          <div className="flex items-start space-x-2">
            <span>4.</span>
            <span>Votre commande sera expédiée sous <strong>7 jours ouvrables</strong> dès réception du paiement</span>
          </div>
        </div>

        <p className="text-sm text-baby-text/60 mb-6">
          Vous recevrez un email de confirmation une fois le paiement vérifié.
        </p>

        <Link href="/boutique" className="btn-primary inline-block">
          Retour à la boutique
        </Link>
      </div>
    </div>
  )
}

export default function TwintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>}>
      <TwintContent />
    </Suspense>
  )
}
