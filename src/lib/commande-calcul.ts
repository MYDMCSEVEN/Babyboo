// Calcul d'une commande CÔTÉ SERVEUR (08.10.2026, sécurité des prix).
//
// Le navigateur n'envoie que des identifiants (produit de la boutique) ou une
// configuration (article « Personnaliser »), et des quantités. Tous les prix,
// les frais de port et le total sont recalculés ici, à partir des produits de
// la base. Les prix éventuellement envoyés par le navigateur sont ignorés.
//
// Ce fichier ne touche pas la base : on lui passe le catalogue déjà chargé,
// ce qui permet de le tester seul (tests-securite/).

import {
  PRODUCT_TYPES,
  COFFRET_TYPES,
  COLORS,
  SHAPES,
  SLUG_BASE,
  PRIX_FORME,
  buildDescription,
  type ConfigPanier,
  type ProductConfig,
  type ProductType,
  type Material,
  type Shape,
} from './personnalisation'

export const FRAIS_PORT = 5.9
export const MODES_PAIEMENT = ['twint', 'stripe', 'cash'] as const
export type ModePaiement = (typeof MODES_PAIEMENT)[number]

const MAX_LIGNES = 30
const MAX_QUANTITE = 20
const MAX_FORMES = 30

export interface ProduitBase {
  id: string
  slug: string
  name: string
  price: number
  inStock: boolean
}

export interface Catalogue {
  parId: Map<string, ProduitBase>
  parSlug: Map<string, ProduitBase>
}

export function construireCatalogue(produits: ProduitBase[]): Catalogue {
  return {
    parId: new Map(produits.map((p) => [p.id, p])),
    parSlug: new Map(produits.map((p) => [p.slug, p])),
  }
}

export interface LigneCalculee {
  nom: string
  nomProduit: string // nom du produit sans le prénom (statistiques de l'admin)
  quantite: number
  prixUnitaire: number // CHF
  total: number // CHF
  productId?: string
  config?: ConfigPanier
  description?: string // description de personnalisation (construite ici pour le configurateur)
  estConfiguree: boolean
}

export type ResultatCalcul =
  | {
      ok: true
      lignes: LigneCalculee[]
      sousTotal: number
      livraison: number
      total: number
      personnalisation: string
    }
  | { ok: false; erreur: string; ligne?: number }

export interface PersoFormulaire {
  noms?: unknown
  materiaux?: unknown
  couleurs?: unknown
  note?: unknown
}

// ─── Petits outils ───

const enCentimes = (chf: number) => Math.round(chf * 100)
const enFrancs = (centimes: number) => centimes / 100

function texte(v: unknown, max: number): string {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, max)
}

const MATERIAUX_FORMULAIRE = ['Silicone alimentaire', 'Bois naturel', 'Mélange silicone + bois']
const MATERIAUX_CONFIG: Material[] = ['silicone', 'bois', 'melange']
const POSITIONS = ['before', 'after', 'between'] as const
const IDS_COULEURS = new Set(COLORS.map((c) => c.id))
const IDS_FORMES = new Set(SHAPES.map((s) => s.id))

/** Valide et nettoie la configuration d'UN article du configurateur. */
function normaliserConfig(brut: unknown, typeImpose?: ProductType): ProductConfig | null {
  if (!brut || typeof brut !== 'object') return null
  const c = brut as Record<string, unknown>

  const productType = (typeImpose ?? c.productType) as ProductType
  if (!PRODUCT_TYPES.some((p) => p.id === productType)) return null

  // Même filtre que le champ « Prénom » du configurateur, sans retours à la ligne ni × ÷
  const name = typeof c.name === 'string' ? c.name.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ -]/g, '').slice(0, 16) : ''
  if (name.trim().length < 1) return null

  if (!Array.isArray(c.selectedColors)) return null
  const selectedColors = Array.from(
    new Set(c.selectedColors.filter((x): x is string => typeof x === 'string' && IDS_COULEURS.has(x)))
  )
  if (selectedColors.length < 1 || selectedColors.length > 4) return null

  const material = c.material as Material
  if (!MATERIAUX_CONFIG.includes(material)) return null

  const formesBrutes = Array.isArray(c.decorativeShapes) ? c.decorativeShapes : []
  if (formesBrutes.length > MAX_FORMES) return null
  const decorativeShapes: ProductConfig['decorativeShapes'] = []
  for (const f of formesBrutes) {
    if (!f || typeof f !== 'object') return null
    const forme = f as Record<string, unknown>
    if (typeof forme.shape !== 'string' || !IDS_FORMES.has(forme.shape as Shape)) return null
    if (!POSITIONS.includes(forme.position as (typeof POSITIONS)[number])) return null
    decorativeShapes.push({
      shape: forme.shape as Shape,
      color: texte(forme.color, 20),
      position: forme.position as (typeof POSITIONS)[number],
    })
  }

  const note = texte(c.note, 500)

  return { productType, name, selectedColors, material, decorativeShapes, note }
}

function quantiteValide(q: unknown): number | null {
  const n = typeof q === 'number' ? q : typeof q === 'string' ? Number(q) : NaN
  if (!Number.isInteger(n) || n < 1 || n > MAX_QUANTITE) return null
  return n
}

// ─── Calcul principal ───

/**
 * Recalcule une commande à partir du panier envoyé par le navigateur.
 * `articles` : [{ productId, quantity, note? }] ou [{ config, quantity }].
 * Tout champ de prix envoyé par le navigateur est ignoré.
 */
export function calculerCommande(
  articles: unknown,
  modePaiement: unknown,
  perso: PersoFormulaire | undefined,
  catalogue: Catalogue
): ResultatCalcul {
  if (!MODES_PAIEMENT.includes(modePaiement as ModePaiement)) {
    return { ok: false, erreur: 'Mode de paiement invalide' }
  }
  if (!Array.isArray(articles) || articles.length === 0) {
    return { ok: false, erreur: 'Votre panier est vide' }
  }
  if (articles.length > MAX_LIGNES) {
    return { ok: false, erreur: 'Trop d’articles dans le panier' }
  }

  const lignes: LigneCalculee[] = []

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i] as Record<string, unknown> | null
    if (!a || typeof a !== 'object') return { ok: false, erreur: 'Article invalide', ligne: i }

    const quantite = quantiteValide(a.quantity)
    if (quantite === null) return { ok: false, erreur: 'Quantité invalide', ligne: i }

    const config = a.config as Record<string, unknown> | undefined

    if (config && typeof config === 'object') {
      // ── Article du configurateur ──
      if (config.kind === 'perso') {
        const cfg = normaliserConfig(config)
        if (!cfg) return { ok: false, erreur: 'Personnalisation invalide : merci de recréer cet article', ligne: i }
        const type = PRODUCT_TYPES.find((p) => p.id === cfg.productType)!
        const base = catalogue.parSlug.get(SLUG_BASE[cfg.productType])
        if (!base || !base.inStock) {
          return { ok: false, erreur: `« ${type.name} » n’est plus disponible`, ligne: i }
        }
        const prixC = enCentimes(base.price) + cfg.decorativeShapes.length * enCentimes(PRIX_FORME)
        lignes.push({
          nom: `${type.name} — ${cfg.name}`,
          nomProduit: type.name,
          quantite,
          prixUnitaire: enFrancs(prixC),
          total: enFrancs(prixC * quantite),
          config: { kind: 'perso', ...cfg },
          description: buildDescription(cfg.productType, cfg),
          estConfiguree: true,
        })
        continue
      }

      if (config.kind === 'coffret') {
        const coffret = COFFRET_TYPES.find((c) => c.id === config.coffretId)
        if (!coffret || !Array.isArray(config.items) || config.items.length !== coffret.items.length) {
          return { ok: false, erreur: 'Coffret invalide : merci de le recréer', ligne: i }
        }
        const cfgs: ProductConfig[] = []
        for (let j = 0; j < coffret.items.length; j++) {
          const cfg = normaliserConfig(config.items[j], coffret.items[j])
          if (!cfg) return { ok: false, erreur: 'Coffret invalide : merci de le recréer', ligne: i }
          cfgs.push(cfg)
        }
        const base = catalogue.parSlug.get(coffret.id)
        if (!base || !base.inStock) {
          return { ok: false, erreur: `« ${coffret.name} » n’est plus disponible`, ligne: i }
        }
        const formes = cfgs.reduce((s, c) => s + c.decorativeShapes.length, 0)
        const prixC = enCentimes(base.price) + formes * enCentimes(PRIX_FORME)
        lignes.push({
          nom: `${coffret.name} — ${cfgs.map((c) => c.name).join(' + ')}`,
          nomProduit: coffret.name,
          quantite,
          prixUnitaire: enFrancs(prixC),
          total: enFrancs(prixC * quantite),
          config: { kind: 'coffret', coffretId: coffret.id, items: cfgs },
          description: cfgs.map((c, j) => buildDescription(coffret.items[j], c)).join(' | '),
          estConfiguree: true,
        })
        continue
      }

      return { ok: false, erreur: 'Article invalide', ligne: i }
    }

    // ── Produit de la boutique ──
    const productId = typeof a.productId === 'string' ? a.productId.slice(0, 100) : ''
    const produit = productId ? catalogue.parId.get(productId) : undefined
    if (!produit) {
      return {
        ok: false,
        erreur: 'Un article de votre panier n’existe plus ou doit être recréé : retirez-le du panier',
        ligne: i,
      }
    }
    if (!produit.inStock) {
      return { ok: false, erreur: `« ${produit.name} » n’est plus disponible`, ligne: i }
    }
    const prixC = enCentimes(produit.price)
    const note = texte(a.note, 2000) // texte libre (ex. « commander à nouveau ») : sans effet sur le prix
    lignes.push({
      nom: produit.name,
      nomProduit: produit.name,
      quantite,
      prixUnitaire: enFrancs(prixC),
      total: enFrancs(prixC * quantite),
      productId: produit.id,
      description: note || undefined,
      estConfiguree: false,
    })
  }

  const sousTotalC = lignes.reduce((s, l) => s + enCentimes(l.total), 0)
  const livraisonC = modePaiement === 'cash' ? 0 : enCentimes(FRAIS_PORT)

  return {
    ok: true,
    lignes,
    sousTotal: enFrancs(sousTotalC),
    livraison: enFrancs(livraisonC),
    total: enFrancs(sousTotalC + livraisonC),
    personnalisation: construirePersonnalisation(lignes, perso),
  }
}

/** Même texte que celui que construisait la page de commande, mais à partir des données du serveur. */
function construirePersonnalisation(lignes: LigneCalculee[], perso: PersoFormulaire | undefined): string {
  const noms = texte(perso?.noms, 200)
  const couleurs = texte(perso?.couleurs, 200)
  const note = texte(perso?.note, 1000)
  const materiaux = Array.isArray(perso?.materiaux)
    ? (perso!.materiaux as unknown[]).filter((m): m is string => typeof m === 'string' && MATERIAUX_FORMULAIRE.includes(m))
    : []

  const toutesPersonnalisees = lignes.length > 0 && lignes.every((l) => !!l.description)

  if (toutesPersonnalisees) {
    return [lignes.map((l) => `${l.nom}: ${l.description}`).join('\n'), note ? `Note : ${note}` : '']
      .filter(Boolean)
      .join('\n')
  }

  return [
    ...lignes.filter((l) => l.description).map((l) => `${l.nom} (configuré): ${l.description}`),
    noms ? `Prénom(s) : ${noms}` : '',
    materiaux.length > 0 ? `Matériaux : ${materiaux.join(' + ')}` : '',
    couleurs ? `Couleur(s) : ${couleurs}` : '',
    note ? `Note : ${note}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// ─── Coordonnées du client ───

const RE_EMAIL = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-zA-Z]{2,}$/
const RE_TEL = /^[+0-9\s()\-]{7,40}$/

export type ResultatClient =
  | { ok: true; nom: string; email: string; telephone: string; adresse: string }
  | { ok: false; erreur: string }

export function validerClient(data: Record<string, unknown>, modePaiement: ModePaiement): ResultatClient {
  const nom = texte(data.name, 100)
  const email = texte(data.email, 200)
  const telephone = texte(data.phone, 40)
  const adresse = texte(data.address, 300)
  if (nom.length < 2) return { ok: false, erreur: 'Nom invalide' }
  if (!RE_EMAIL.test(email)) return { ok: false, erreur: 'Adresse e-mail invalide' }
  if (!RE_TEL.test(telephone)) return { ok: false, erreur: 'Numéro de téléphone invalide' }
  if (modePaiement !== 'cash' && adresse.length < 5) return { ok: false, erreur: 'Adresse de livraison manquante' }
  return { ok: true, nom, email, telephone, adresse: modePaiement === 'cash' ? '' : adresse }
}

export function emailValide(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 200 && RE_EMAIL.test(email.trim())
}
