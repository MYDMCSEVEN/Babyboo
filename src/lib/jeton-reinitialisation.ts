// Lien « mot de passe oublié » (08.10.2026).
//
// - Signé avec NEXTAUTH_SECRET, sans AUCUNE clé de repli : si le secret
//   manque, on refuse de créer ou de lire un lien.
// - À usage unique : la signature contient une empreinte du mot de passe
//   actuel. Dès que le mot de passe change (donc dès la première utilisation),
//   le lien ne vaut plus rien.
// - Valable 1 heure. Signature comparée à temps constant (timingSafeEqual).

import crypto from 'crypto'

export const DUREE_LIEN_MS = 60 * 60 * 1000

/** Secret de signature, ou null s'il manque (dans ce cas : refuser). */
export function secretSignature(): string | null {
  const s = process.env.NEXTAUTH_SECRET
  return s && s.length >= 16 ? s : null
}

function signer(secret: string, userId: string, expire: number, hashMotDePasse: string): Buffer {
  const empreinteMdp = crypto.createHash('sha256').update(hashMotDePasse).digest('hex')
  return crypto
    .createHmac('sha256', secret)
    .update(`babyboo-reinit-v2|${userId}|${expire}|${empreinteMdp}`)
    .digest()
}

export function creerJeton(secret: string, userId: string, hashMotDePasse: string, maintenant = Date.now()): string {
  const expire = maintenant + DUREE_LIEN_MS
  const charge = Buffer.from(JSON.stringify({ u: userId, e: expire })).toString('base64url')
  const signature = signer(secret, userId, expire, hashMotDePasse).toString('base64url')
  return `${charge}.${signature}`
}

/** Lit le contenu du jeton SANS le vérifier (pour retrouver le compte). */
export function lireJeton(jeton: unknown): { userId: string; expire: number; signature: Buffer } | null {
  if (typeof jeton !== 'string' || jeton.length > 1000) return null
  const morceaux = jeton.split('.')
  if (morceaux.length !== 2) return null
  try {
    const data = JSON.parse(Buffer.from(morceaux[0], 'base64url').toString('utf-8'))
    if (typeof data?.u !== 'string' || typeof data?.e !== 'number') return null
    return { userId: data.u, expire: data.e, signature: Buffer.from(morceaux[1], 'base64url') }
  } catch {
    return null
  }
}

export type Verification = 'valide' | 'expire' | 'invalide'

export function verifierJeton(
  secret: string,
  jeton: { userId: string; expire: number; signature: Buffer },
  hashMotDePasseActuel: string,
  maintenant = Date.now()
): Verification {
  const attendu = signer(secret, jeton.userId, jeton.expire, hashMotDePasseActuel)
  // timingSafeEqual exige deux tampons de même longueur
  if (jeton.signature.length !== attendu.length || !crypto.timingSafeEqual(jeton.signature, attendu)) {
    return 'invalide'
  }
  if (jeton.expire < maintenant) return 'expire'
  return 'valide'
}
