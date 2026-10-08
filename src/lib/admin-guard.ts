import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Vérifie côté serveur que la requête vient de l'admin connecté
 * (même contrôle que les routes produits et commandes).
 * Renvoie true si la session est celle de l'admin.
 */
export async function estAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    return !!session?.user && session.user.role === 'ADMIN'
  } catch {
    return false
  }
}
