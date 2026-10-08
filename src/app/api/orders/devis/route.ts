import { NextRequest, NextResponse } from 'next/server'
import { calculerCommande } from '@/lib/commande-calcul'
import { chargerCatalogue } from '@/lib/catalogue-serveur'

// Devis (08.10.2026) : la page de commande affiche les montants calculés par
// le serveur AVANT de commander. Lecture seule : rien n'est enregistré ni envoyé.
export async function POST(req: NextRequest) {
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  try {
    const calcul = calculerCommande(data?.items, data?.paymentMethod, undefined, await chargerCatalogue())
    if (!calcul.ok) {
      return NextResponse.json({ error: calcul.erreur, ligne: calcul.ligne }, { status: 400 })
    }
    return NextResponse.json({
      lignes: calcul.lignes.map((l) => ({ nom: l.nom, quantite: l.quantite, prixUnitaire: l.prixUnitaire, total: l.total })),
      sousTotal: calcul.sousTotal,
      livraison: calcul.livraison,
      total: calcul.total,
    })
  } catch (error) {
    console.error('Erreur de devis :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
