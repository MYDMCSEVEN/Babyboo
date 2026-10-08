import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { emailValide } from '@/lib/commande-calcul'
import { limiteDepassee, ipDe, estRobot, MESSAGE_LIMITE } from '@/lib/limite-essais'

// Inscription (08.10.2026) : limite d'essais par IP et par e-mail, champ piège,
// et réponse IDENTIQUE que l'adresse soit déjà utilisée ou non (pas d'énumération).
const REPONSE_NEUTRE = { success: true }

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => null)
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
    }

    // Robot : fausse réussite, rien n'est créé
    if (estRobot(data)) return NextResponse.json(REPONSE_NEUTRE)

    const name = typeof data.name === 'string' ? data.name.trim().slice(0, 100) : ''
    const email = typeof data.email === 'string' ? data.email.trim() : ''
    const phone = typeof data.phone === 'string' ? data.phone.trim().slice(0, 40) : ''
    const password = typeof data.password === 'string' ? data.password : ''

    if (!name || !emailValide(email) || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe sont requis' },
        { status: 400 }
      )
    }
    if (password.length < 6 || password.length > 200) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    if (
      await limiteDepassee([
        { portee: 'inscription-ip', valeur: ipDe(req), max: 5, fenetreSec: 3600 },
        { portee: 'inscription-email', valeur: email, max: 3, fenetreSec: 3600 },
      ])
    ) {
      return NextResponse.json({ error: MESSAGE_LIMITE }, { status: 429 })
    }

    // Hachage TOUJOURS fait (même durée de réponse, compte existant ou non)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Adresse déjà utilisée, sans tenir compte des majuscules
    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
    if (!existing) {
      await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: 'CUSTOMER',
        },
      })
    }

    // Même réponse dans les deux cas
    return NextResponse.json(REPONSE_NEUTRE)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}
