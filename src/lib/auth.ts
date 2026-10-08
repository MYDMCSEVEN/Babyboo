import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { limiteAtteinte, compterEchec, ipDepuisEntetes, type RegleLimite } from '@/lib/limite-essais'

// Empreinte factice : même travail bcrypt quand le compte n'existe pas (08.10.2026)
const EMPREINTE_FACTICE = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10)

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        // Limite d'essais de connexion (08.10.2026) : seuls les ÉCHECS sont comptés.
        // Par IP pour tous ; par adresse e-mail pour les clients seulement (pour qu'un
        // inconnu ne puisse pas bloquer la connexion admin en se trompant exprès).
        // Au-delà : refus, avec le même message qu'un mauvais mot de passe.
        const entetes = (req?.headers || {}) as Record<string, string | undefined>
        const ip = ipDepuisEntetes((nom) => entetes[nom])
        const estAdresseAdmin = credentials.email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@babyboo.ch').toLowerCase()
        const regles: RegleLimite[] = [{ portee: 'connexion-echec-ip', valeur: ip, max: 20, fenetreSec: 900 }]
        if (!estAdresseAdmin) {
          regles.push({ portee: 'connexion-echec-email', valeur: credentials.email, max: 10, fenetreSec: 900 })
        }
        if (await limiteAtteinte(regles)) {
          console.warn('Connexion refusée : trop de tentatives')
          return null
        }
        const echec = async () => {
          await compterEchec(regles)
          return null
        }

        // Connexion admin via les variables d'environnement.
        // Sécurité (07.10.2026) : plus AUCUN mot de passe par défaut.
        // Si ADMIN_PASSWORD n'est pas défini, toute connexion admin est refusée.
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@babyboo.ch'
        const adminPassword = process.env.ADMIN_PASSWORD

        if (credentials.email === adminEmail) {
          if (!adminPassword) {
            console.error('Connexion admin refusée : ADMIN_PASSWORD absent de la configuration')
            return null
          }
          // Comparaison à temps constant (empreintes de même longueur)
          const recu = crypto.createHash('sha256').update(credentials.password).digest()
          const attendu = crypto.createHash('sha256').update(adminPassword).digest()
          if (crypto.timingSafeEqual(recu, attendu)) {
            return { id: 'admin', email: adminEmail, name: 'Admin', role: 'ADMIN' }
          }
          return echec()
        }

        // Customer login from database
        try {
          // Sans tenir compte des majuscules, comme l'inscription et « mot de passe oublié »
          const user = await prisma.user.findFirst({
            where: { email: { equals: credentials.email.trim(), mode: 'insensitive' } },
          })

          if (!user) {
            await bcrypt.compare(credentials.password, EMPREINTE_FACTICE)
            return echec()
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return echec()

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/compte' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = user.role || 'CUSTOMER'
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
}
