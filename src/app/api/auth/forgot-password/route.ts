import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { emailValide } from '@/lib/commande-calcul'
import { creerJeton, secretSignature } from '@/lib/jeton-reinitialisation'
import { limiteDepassee, ipDe, estRobot, MESSAGE_LIMITE, dureeMinimum, enArrierePlan } from '@/lib/limite-essais'

// Mot de passe oublié (08.10.2026) : plus de clé de repli, lien à usage unique,
// limite d'essais par IP et par e-mail, champ piège, réponse toujours neutre.
// Durée de réponse identique, que le compte existe ou non (pas d'énumération par le délai)
const DUREE_MIN_MS = 1200

export async function POST(req: NextRequest) {
  const debut = Date.now()
  try {
    const secret = secretSignature()
    if (!secret) {
      console.error('Mot de passe oublié refusé : NEXTAUTH_SECRET absent de la configuration')
      return NextResponse.json({ error: 'Service momentanément indisponible' }, { status: 503 })
    }

    const data = await req.json().catch(() => null)
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Robot : même réponse qu'une vraie demande, rien n'est envoyé
    if (estRobot(data)) return NextResponse.json({ success: true })

    const email = typeof data.email === 'string' ? data.email.trim() : ''
    if (!emailValide(email)) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Compté AVANT de chercher le compte : la limite ne révèle rien
    if (
      await limiteDepassee([
        { portee: 'oubli-ip', valeur: ipDe(req), max: 5, fenetreSec: 3600 },
        { portee: 'oubli-email', valeur: email, max: 3, fenetreSec: 3600 },
      ])
    ) {
      return NextResponse.json({ error: MESSAGE_LIMITE }, { status: 429 })
    }

    // Recherche sans tenir compte des majuscules (« Marie@… » = « marie@… »)
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })

    if (user) {
      const resetToken = creerJeton(secret, user.id, user.password)
      const resetUrl = `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/compte/reset-password?token=${resetToken}`
      // Envoi après la réponse ; une panne d'envoi est notée mais ne change pas la réponse
      await enArrierePlan(() => sendPasswordResetEmail(user.email, user.name, resetUrl))
    }

    // Toujours la même réponse, dans le même délai (pas d'énumération des comptes)
    await dureeMinimum(debut, DUREE_MIN_MS)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
