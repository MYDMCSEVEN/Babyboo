import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { lireJeton, secretSignature, verifierJeton } from '@/lib/jeton-reinitialisation'

// Réinitialisation (08.10.2026) : secret obligatoire, signature vérifiée à
// temps constant, lien à usage unique (lié au mot de passe actuel).
const INVALIDE = 'Lien invalide ou expiré'

export async function POST(req: NextRequest) {
  try {
    const secret = secretSignature()
    if (!secret) {
      console.error('Réinitialisation refusée : NEXTAUTH_SECRET absent de la configuration')
      return NextResponse.json({ error: 'Service momentanément indisponible' }, { status: 503 })
    }

    const data = await req.json().catch(() => null)
    const token = data?.token
    const password = data?.password

    if (!token || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
    }

    if (password.length < 6 || password.length > 200) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    const jeton = lireJeton(token)
    if (!jeton) {
      return NextResponse.json({ error: INVALIDE }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: jeton.userId } })
    if (!user) {
      return NextResponse.json({ error: INVALIDE }, { status: 400 })
    }

    const verdict = verifierJeton(secret, jeton, user.password)
    if (verdict === 'expire') {
      return NextResponse.json({ error: 'Ce lien a expiré. Veuillez faire une nouvelle demande.' }, { status: 400 })
    }
    if (verdict !== 'valide') {
      return NextResponse.json({ error: INVALIDE }, { status: 400 })
    }

    // Mise à jour SEULEMENT si le mot de passe n'a pas changé entre-temps :
    // deux utilisations simultanées du même lien ne peuvent pas réussir toutes les deux.
    const hashedPassword = await bcrypt.hash(password, 10) // même coût partout (délais identiques)
    const resultat = await prisma.user.updateMany({
      where: { id: user.id, password: user.password },
      data: { password: hashedPassword },
    })
    if (resultat.count !== 1) {
      return NextResponse.json({ error: INVALIDE }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
