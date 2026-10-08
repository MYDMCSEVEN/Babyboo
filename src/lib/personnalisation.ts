// Catalogue du configurateur « Personnaliser » (08.10.2026, sécurité des prix).
// Fichier PARTAGÉ : la page (navigateur) l'utilise pour l'affichage, et le
// serveur (/api/orders) l'utilise pour RECALCULER le prix et la description.
// Les prix de base affichés ici sont indicatifs : le serveur facture le prix
// du produit correspondant dans la base (voir SLUG_BASE), + 1 CHF par forme.

export type ProductType = 'attache-lolette' | 'porte-cles' | 'hochet' | 'chaine-telephone' | 'chainette-poussette'
export type Material = 'silicone' | 'bois' | 'melange'
export type Shape = 'coeur' | 'etoile' | 'couronne' | 'ourson' | 'lune' | 'fleur' | 'papillon' | 'rond-bois' | 'hello-kitty' | 'fraise' | 'tournesol' | 'abeille' | 'hexagone'

export interface CoffretType {
  id: string
  name: string
  description: string
  price: number
  icon: string
  items: ProductType[]
}

export interface ProductConfig {
  productType: ProductType
  name: string
  selectedColors: string[]
  material: Material
  decorativeShapes: { shape: Shape; color: string; position: 'before' | 'after' | 'between' }[]
  note: string
}

// Configuration transmise par le panier au serveur (le prix n'en fait PAS partie)
export type ConfigPanier =
  | ({ kind: 'perso' } & ProductConfig)
  | { kind: 'coffret'; coffretId: string; items: ProductConfig[] }

export const PRODUCT_TYPES: { id: ProductType; name: string; description: string; basePrice: number; icon: string; maxBeads: number }[] = [
  { id: 'attache-lolette', name: 'Attache-lolette', description: 'Clip + perles + anneau', basePrice: 22, icon: '🍼', maxBeads: 14 },
  { id: 'porte-cles', name: 'Porte-clés', description: 'Anneau + perles personnalisées', basePrice: 12, icon: '🔑', maxBeads: 10 },
  { id: 'hochet', name: 'Hochet de dentition', description: 'Anneau bois + perles', basePrice: 12, icon: '🪇', maxBeads: 12 },
  { id: 'chaine-telephone', name: 'Chaîne de téléphone', description: 'Cordon + perles', basePrice: 19, icon: '📱', maxBeads: 16 },
  { id: 'chainette-poussette', name: 'Chaînette de poussette', description: '2 clips + perles', basePrice: 28, icon: '👶', maxBeads: 18 },
]

export const COFFRET_TYPES: CoffretType[] = [
  {
    id: 'coffret-lolette-porte-cles',
    name: 'Coffret Attache-lolette + Porte-clés',
    description: 'Personnalisez les deux articles du coffret',
    price: 32,
    icon: '🎁',
    items: ['attache-lolette', 'porte-cles'],
  },
  {
    id: 'coffret-lolette-hochet',
    name: 'Coffret Attache-lolette + Hochet',
    description: 'Personnalisez les deux articles du coffret',
    price: 32,
    icon: '🎁',
    items: ['attache-lolette', 'hochet'],
  },
]

export const COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'blanc', name: 'Blanc', hex: '#F5F5F0' },
  { id: 'rose-pale', name: 'Rose pâle', hex: '#F8C8DC' },
  { id: 'rose-vif', name: 'Rose vif', hex: '#E75480' },
  { id: 'mauve', name: 'Mauve', hex: '#C8A2C8' },
  { id: 'lilas', name: 'Lilas', hex: '#B39EB5' },
  { id: 'bleu-ciel', name: 'Bleu ciel', hex: '#87CEEB' },
  { id: 'bleu-marine', name: 'Bleu marine', hex: '#4A6FA5' },
  { id: 'menthe', name: 'Menthe', hex: '#98D8C8' },
  { id: 'sauge', name: 'Sauge', hex: '#9CAF88' },
  { id: 'jaune', name: 'Jaune pastel', hex: '#FDFD96' },
  { id: 'peche', name: 'Pêche', hex: '#FFDAB9' },
  { id: 'corail', name: 'Corail', hex: '#F08080' },
  { id: 'terracotta', name: 'Terracotta', hex: '#CC7755' },
  { id: 'beige', name: 'Beige', hex: '#D4C5A9' },
  { id: 'gris', name: 'Gris', hex: '#B0B0B0' },
  { id: 'noir', name: 'Noir', hex: '#333333' },
]

export const SHAPES: { id: Shape; name: string; emoji: string }[] = [
  { id: 'ourson', name: 'Ourson', emoji: '🧸' },
  { id: 'hello-kitty', name: 'Hello Kitty', emoji: '🐱' },
  { id: 'abeille', name: 'Abeille', emoji: '🐝' },
  { id: 'fraise', name: 'Fraise', emoji: '🍓' },
  { id: 'tournesol', name: 'Tournesol', emoji: '🌻' },
  { id: 'coeur', name: 'Coeur', emoji: '❤️' },
  { id: 'etoile', name: 'Étoile', emoji: '⭐' },
  { id: 'couronne', name: 'Couronne', emoji: '👑' },
  { id: 'lune', name: 'Lune', emoji: '🌙' },
  { id: 'fleur', name: 'Fleur', emoji: '🌸' },
  { id: 'papillon', name: 'Papillon', emoji: '🦋' },
  { id: 'hexagone', name: 'Hexagone', emoji: '⬡' },
  { id: 'rond-bois', name: 'Perle bois', emoji: '🪵' },
]

// Produit de la base (slug) dont le prix sert de prix de base côté serveur
export const SLUG_BASE: Record<ProductType, string> = {
  'attache-lolette': 'attache-lolette',
  'porte-cles': 'porte-cles',
  'hochet': 'hochet-dentition',
  'chaine-telephone': 'chaine-telephone',
  'chainette-poussette': 'chainette-poussette',
}

// Supplément par forme décorative (CHF) — même règle que l'affichage du configurateur
export const PRIX_FORME = 1

export function buildDescription(pt: ProductType, cfg: { name: string; selectedColors: string[]; material: Material; decorativeShapes: { shape: Shape; color: string; position: string }[]; note: string }): string {
  const p = PRODUCT_TYPES.find(t => t.id === pt)
  const materialLabel = cfg.material === 'bois' ? 'Bois naturel' : cfg.material === 'melange' ? 'Mélange silicone + bois' : 'Silicone alimentaire'
  const colorNames = cfg.selectedColors.map(c => COLORS.find(co => co.id === c)?.name).filter(Boolean)

  const beforeShapes = cfg.decorativeShapes.filter(d => d.position === 'before')
  const afterShapes = cfg.decorativeShapes.filter(d => d.position === 'after')

  // Build ordered composition description
  const compositionParts: string[] = []

  // Start element
  if (pt === 'attache-lolette' || pt === 'chainette-poussette') compositionParts.push('[Clip]')
  if (pt === 'porte-cles') compositionParts.push('[Anneau]')

  // Before shapes
  beforeShapes.forEach(d => {
    const s = SHAPES.find(sh => sh.id === d.shape)
    compositionParts.push(`${s?.emoji || ''} ${s?.name || d.shape}`)
  })

  // Name beads
  compositionParts.push(`[${cfg.name.toUpperCase()}]`)

  // After shapes
  afterShapes.forEach(d => {
    const s = SHAPES.find(sh => sh.id === d.shape)
    compositionParts.push(`${s?.emoji || ''} ${s?.name || d.shape}`)
  })

  // End element
  if (pt === 'attache-lolette') compositionParts.push('[Anneau bois]')
  if (pt === 'hochet') compositionParts.push('[Anneau bois]')
  if (pt === 'chainette-poussette') compositionParts.push('[Clip]')

  const lines = [
    `PRODUIT: ${p?.name}`,
    `PRÉNOM: ${cfg.name.toUpperCase()}`,
    `MATÉRIAU: ${materialLabel}`,
    `COULEURS: ${colorNames.join(', ')}`,
    `COMPOSITION: ${compositionParts.join(' → ')}`,
  ]

  if (cfg.decorativeShapes.length > 0) {
    lines.push(`FORMES: ${cfg.decorativeShapes.map(d => { const s = SHAPES.find(sh => sh.id === d.shape); return `${s?.emoji} ${s?.name} (${d.position === 'before' ? 'avant' : 'après'})` }).join(', ')}`)
  }

  if (cfg.note) {
    lines.push(`NOTE: ${cfg.note}`)
  }

  return lines.join('\n')
}
