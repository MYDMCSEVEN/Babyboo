import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@babyboo.ch'
        const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'

        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return { id: '1', email: adminEmail }
        }

        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin' },
  secret: process.env.NEXTAUTH_SECRET,
}
