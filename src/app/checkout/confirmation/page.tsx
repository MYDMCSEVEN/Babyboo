import Link from 'next/link'

export default function ConfirmationPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="font-serif text-3xl text-baby-text mb-4">Merci pour votre commande !</h1>
      <p className="text-baby-text/70 mb-4">
        Votre commande a bien été enregistrée. Nous vous contacterons très bientôt
        pour organiser le retrait et finaliser le paiement.
      </p>
      <p className="text-baby-text/70 mb-8">
        Un email de confirmation vous sera envoyé à l&apos;adresse indiquée.
      </p>
      <div className="space-y-4">
        <Link href="/boutique" className="btn-primary inline-block">
          Continuer mes achats
        </Link>
      </div>
    </div>
  )
}
