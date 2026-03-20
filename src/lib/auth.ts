import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { compareSync } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        })

        if (!admin || !compareSync(credentials.password, admin.password)) {
          return null
        }

        return { id: admin.id, email: admin.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin' },
  secret: process.env.NEXTAUTH_SECRET,
}
