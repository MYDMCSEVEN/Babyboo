// Limite d'essais par IP et par adresse e-mail (08.10.2026).
// Stockage : table « LimiteEssai » de la base Neon (aucun service en plus).
// Fenêtre fixe : au-delà de `max` essais dans la fenêtre, la requête est refusée.

import crypto from 'crypto'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CHAMP_PIEGE } from '@/lib/champ-piege'

export interface RegleLimite {
  portee: string // ex. 'inscription-ip'
  valeur: string // IP ou adresse e-mail
  max: number
  fenetreSec: number
}

/** Empreinte de la clé : on ne stocke ni IP ni e-mail en clair. */
export function normaliser(v: string): string {
  v = v.trim().toLowerCase()
  if (v.includes('@')) {
    // nom+etiquette@domaine -> nom@domaine (même boîte aux lettres)
    const [local, domaine] = v.split('@')
    return `${local.split('+')[0]}@${domaine}`
  }
  // IPv4 écrite en IPv6 (::ffff:1.2.3.4) -> IPv4
  const v4 = v.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (v4) return v4[1]
  if (v.includes(':')) {
    // IPv6 : une machine dispose d'un bloc /64 entier -> on compte par /64
    return developperIpv6(v).slice(0, 4).join(':') + '::/64'
  }
  return v
}

/** « 2001:db8::1 » -> 8 blocs complets (forme abrégée ou non : même résultat). */
function developperIpv6(v: string): string[] {
  const [gauche, droite] = v.split('::')
  const g = gauche ? gauche.split(':') : []
  const d = droite !== undefined && droite !== '' ? droite.split(':') : []
  const milieu = droite !== undefined ? Array(Math.max(0, 8 - g.length - d.length)).fill('0') : []
  return [...g, ...milieu, ...d].slice(0, 8).map((b) => (parseInt(b, 16) || 0).toString(16))
}

function cleDe(r: RegleLimite): string {
  const v = normaliser(r.valeur)
  return `${r.portee}:${crypto.createHash('sha256').update(`babyboo|${r.portee}|${v}`).digest('hex')}`
}

/** IP du visiteur. Sur Vercel, x-real-ip / x-forwarded-for sont posés par Vercel. */
export function ipDe(req: NextRequest): string {
  return ipDepuisEntetes((nom) => req.headers.get(nom))
}

/** Même chose à partir d'une fonction de lecture d'en-tête (ex. connexion NextAuth). */
export function ipDepuisEntetes(lire: (nom: string) => string | null | undefined): string {
  const reelle = lire('x-real-ip')
  if (reelle) return String(reelle).trim()
  const fwd = lire('x-forwarded-for')
  if (fwd) return String(fwd).split(',')[0].trim()
  return 'inconnue'
}

/** Attend que `debut + ms` soit atteint : même durée de réponse quel que soit le cas. */
export async function dureeMinimum(debut: number, ms: number): Promise<void> {
  const reste = debut + ms - Date.now()
  if (reste > 0) await new Promise((r) => setTimeout(r, reste))
}

/**
 * Lance une tâche après la réponse (Vercel : waitUntil du contexte de requête,
 * le même mécanisme que @vercel/functions). Hors Vercel : on attend la tâche.
 */
export async function enArrierePlan(tache: () => Promise<void>): Promise<void> {
  const protegee = tache().catch((e) => console.error('Tâche en arrière-plan échouée :', (e as Error).message))
  const ctx = (globalThis as any)[Symbol.for('@vercel/request-context')]?.get?.()
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(protegee)
    return
  }
  await protegee
}

/**
 * Lecture seule : true si l'une des règles a déjà atteint son maximum dans sa fenêtre.
 * Sert à la connexion, où seuls les ÉCHECS sont comptés (voir compterEchec).
 */
export async function limiteAtteinte(regles: RegleLimite[]): Promise<boolean> {
  try {
    for (const r of regles) {
      const lignes = await prisma.$queryRaw<{ compteur: number }[]>`
        SELECT "compteur" FROM "LimiteEssai"
        WHERE "cle" = ${cleDe(r)} AND "debut" >= NOW() - make_interval(secs => ${r.fenetreSec})`
      if ((lignes[0]?.compteur ?? 0) >= r.max) return true
    }
  } catch (e) {
    console.error('Limite d’essais indisponible (requête autorisée) :', (e as Error).message)
  }
  return false
}

/** Compte un échec (connexion ratée) pour chaque règle. */
export async function compterEchec(regles: RegleLimite[]): Promise<void> {
  await limiteDepassee(regles)
}

/**
 * Compte un essai pour chaque règle et renvoie true si l'une d'elles est dépassée.
 * En cas de panne de la base, on laisse passer (on ne bloque pas la boutique)
 * mais on le note dans les journaux.
 */
export async function limiteDepassee(regles: RegleLimite[]): Promise<boolean> {
  let depassee = false
  try {
    for (const r of regles) {
      const lignes = await prisma.$queryRaw<{ compteur: number }[]>`
        INSERT INTO "LimiteEssai" ("cle", "compteur", "debut")
        VALUES (${cleDe(r)}, 1, NOW())
        ON CONFLICT ("cle") DO UPDATE SET
          "compteur" = CASE
            WHEN "LimiteEssai"."debut" < NOW() - make_interval(secs => ${r.fenetreSec}) THEN 1
            ELSE "LimiteEssai"."compteur" + 1 END,
          "debut" = CASE
            WHEN "LimiteEssai"."debut" < NOW() - make_interval(secs => ${r.fenetreSec}) THEN NOW()
            ELSE "LimiteEssai"."debut" END
        RETURNING "compteur"`
      if ((lignes[0]?.compteur ?? 0) > r.max) depassee = true
    }
    // Ménage occasionnel (≈ 1 appel sur 50) : on oublie tout ce qui a plus de 24 h
    if (Math.random() < 0.02) {
      await prisma.$executeRaw`DELETE FROM "LimiteEssai" WHERE "debut" < NOW() - INTERVAL '24 hours'`
    }
  } catch (e) {
    console.error('Limite d’essais indisponible (requête autorisée) :', (e as Error).message)
    return false
  }
  return depassee
}

export const MESSAGE_LIMITE = 'Trop de tentatives. Merci de réessayer dans un moment.'

/** Champ piège anti-robot : invisible pour les humains, rempli par les robots. */
export function estRobot(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const v = (data as Record<string, unknown>)[CHAMP_PIEGE]
  if (v === undefined || v === null) return false
  return typeof v === 'string' ? v.trim() !== '' : true
}
