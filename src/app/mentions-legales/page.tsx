export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-4xl text-baby-text mb-8">Mentions légales</h1>

      <div className="bg-white rounded-2xl p-8 shadow-sm space-y-6 text-baby-text/80">
        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Entreprise</h2>
          <p>Babyboo Création</p>
          <p>Suisse</p>
          <p>Email : info@babyboo-creations.ch</p>
          <p>Tél : 079 270 41 01</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Produits</h2>
          <p>
            Tous nos produits sont faits main en Suisse. Ils sont fabriqués à partir de
            bois naturel et de silicone de qualité alimentaire, sans BPA et non toxiques.
            Les produits sont conçus pour être sûrs pour les enfants.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Service client</h2>
          <p>
            En cas de problème avec un produit, nous vous invitons à nous envoyer une photo
            par email. Chaque situation est examinée au cas par cas. Nous nous engageons à
            trouver une solution adaptée (réparation, remplacement de cordon, etc.) si le
            défaut n&apos;est pas dû à une usure normale.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Livraison et retrait</h2>
          <p>
            Retrait en main propre uniquement, en Suisse. Les détails du retrait sont
            communiqués après la commande.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Paiement</h2>
          <p>
            Moyens de paiement acceptés : Twint, espèces (au retrait), carte bancaire (via Stripe).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-baby-text mb-3">Protection des données</h2>
          <p>
            Les informations collectées lors de votre commande sont utilisées uniquement
            pour le traitement de celle-ci. Vos données ne sont jamais transmises à des
            tiers à des fins commerciales.
          </p>
        </section>
      </div>
    </div>
  )
}
