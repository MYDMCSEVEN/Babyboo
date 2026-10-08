'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { addToCart } from '@/lib/cart'
import {
  PRODUCT_TYPES, COFFRET_TYPES, COLORS, SHAPES, buildDescription,
  type ProductType, type Material, type Shape, type CoffretType, type ProductConfig,
} from '@/lib/personnalisation'

interface BeadItem {
  type: 'letter' | 'color' | 'shape' | 'wood' | 'clip' | 'ring'
  value: string
  color?: string
  label?: string
}

// ─── Config ───
// Map product slugs to configurator product types
const SLUG_TO_TYPE: Record<string, ProductType> = {
  'attache-lolette': 'attache-lolette',
  'porte-cles': 'porte-cles',
  'porte-cles-double': 'porte-cles',
  'hochet-dentition': 'hochet',
  'chaine-telephone': 'chaine-telephone',
  'chainette-poussette': 'chainette-poussette',
}

const SLUG_TO_COFFRET: Record<string, string> = {
  'coffret-lolette-porte-cles': 'coffret-lolette-porte-cles',
  'coffret-lolette-hochet': 'coffret-lolette-hochet',
}

const STEPS = ['Produit', 'Prénom', 'Couleurs', 'Composition', 'Aperçu']

function buildComposition(
  productType: ProductType | null,
  name: string,
  selectedColors: string[],
  material: Material,
  decorativeShapes: { shape: Shape; color: string; position: 'before' | 'after' | 'between' }[]
): BeadItem[] {
  const product = PRODUCT_TYPES.find(p => p.id === productType)
  if (!product) return []
  const items: BeadItem[] = []
  const mainColor = selectedColors[0] || '#F8C8DC'
  const altColor = selectedColors[1] || selectedColors[0] || '#F5F5F0'

  if (productType === 'attache-lolette' || productType === 'chainette-poussette') {
    items.push({ type: 'clip', value: 'clip', color: '#C0C0C0', label: 'Clip' })
  }
  if (productType === 'porte-cles') {
    items.push({ type: 'ring', value: 'ring', color: '#C0C0C0', label: 'Anneau' })
  }

  decorativeShapes.filter(d => d.position === 'before').forEach(d => {
    const shape = SHAPES.find(s => s.id === d.shape)
    items.push({ type: 'shape', value: shape?.emoji || '●', color: d.color, label: shape?.name })
  })

  if (material !== 'silicone') {
    items.push({ type: 'wood', value: '●', color: '#D4A373', label: 'Bois' })
  } else {
    items.push({ type: 'color', value: '●', color: altColor })
  }

  const letters = name.toUpperCase().split('')
  letters.forEach((letter, i) => {
    items.push({ type: 'letter', value: letter, color: '#FFFFFF', label: letter })
    if (i < letters.length - 1) {
      if (material === 'bois') {
        items.push({ type: 'wood', value: '●', color: '#D4A373', label: 'Bois' })
      } else {
        const c = selectedColors[i % selectedColors.length] || mainColor
        const colorObj = COLORS.find(co => co.id === c)
        items.push({ type: 'color', value: '●', color: colorObj?.hex || c })
      }
    }
  })

  decorativeShapes.filter(d => d.position === 'between').forEach(d => {
    const shape = SHAPES.find(s => s.id === d.shape)
    items.push({ type: 'shape', value: shape?.emoji || '●', color: d.color, label: shape?.name })
  })

  if (material !== 'silicone') {
    items.push({ type: 'wood', value: '●', color: '#D4A373', label: 'Bois' })
  } else {
    items.push({ type: 'color', value: '●', color: altColor })
  }

  decorativeShapes.filter(d => d.position === 'after').forEach(d => {
    const shape = SHAPES.find(s => s.id === d.shape)
    items.push({ type: 'shape', value: shape?.emoji || '●', color: d.color, label: shape?.name })
  })

  if (productType === 'attache-lolette') {
    items.push({ type: 'ring', value: 'ring', color: '#D4A373', label: 'Anneau' })
  }
  if (productType === 'hochet') {
    items.push({ type: 'ring', value: 'ring', color: '#D4A373', label: 'Anneau bois' })
  }
  if (productType === 'chainette-poussette') {
    items.push({ type: 'clip', value: 'clip', color: '#C0C0C0', label: 'Clip' })
  }

  return items
}

function PersonnaliserContent() {
  const searchParams = useSearchParams()
  const typeParam = searchParams.get('type')

  const [step, setStep] = useState(0)
  const [productType, setProductType] = useState<ProductType | null>(null)
  const [name, setName] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [material, setMaterial] = useState<Material>('silicone')
  const [decorativeShapes, setDecorativeShapes] = useState<{ shape: Shape; color: string; position: 'before' | 'after' | 'between' }[]>([])
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  // Coffret mode
  const [isCoffret, setIsCoffret] = useState(false)
  const [coffret, setCoffret] = useState<CoffretType | null>(null)
  const [coffretItemIndex, setCoffretItemIndex] = useState(0)
  const [coffretConfigs, setCoffretConfigs] = useState<ProductConfig[]>([])

  // Auto-select product from URL param
  useEffect(() => {
    if (!typeParam) return

    // Check if it's a coffret
    const coffretId = SLUG_TO_COFFRET[typeParam]
    if (coffretId) {
      const c = COFFRET_TYPES.find(ct => ct.id === coffretId)
      if (c) {
        setIsCoffret(true)
        setCoffret(c)
        setProductType(c.items[0])
        setCoffretItemIndex(0)
        setStep(1) // Skip product selection
        return
      }
    }

    // Check if it's a single product
    const mapped = SLUG_TO_TYPE[typeParam]
    if (mapped) {
      setProductType(mapped)
      setStep(1) // Skip product selection, go to name
    }
  }, [typeParam])

  const product = PRODUCT_TYPES.find(p => p.id === productType)

  const composition = useMemo(() => {
    return buildComposition(productType, name, selectedColors, material, decorativeShapes)
  }, [productType, name, selectedColors, material, decorativeShapes])

  const toggleColor = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId)
        ? prev.filter(c => c !== colorId)
        : prev.length < 4 ? [...prev, colorId] : prev
    )
  }

  const addShape = (shapeId: Shape, position: 'before' | 'after' | 'between') => {
    const mainColorId = selectedColors[0] || 'rose-pale'
    const colorObj = COLORS.find(c => c.id === mainColorId)
    setDecorativeShapes(prev => [...prev, { shape: shapeId, color: colorObj?.hex || '#F8C8DC', position }])
  }

  const removeShape = (index: number) => {
    setDecorativeShapes(prev => prev.filter((_, i) => i !== index))
  }

  const shapesPrice = decorativeShapes.length * 1
  const totalPrice = product ? product.basePrice + shapesPrice : 0
  const coffretTotalPrice = isCoffret && coffret ? coffret.price + coffretConfigs.reduce((sum, c, i) => sum + (i === coffretItemIndex ? 0 : c.decorativeShapes.length), 0) + shapesPrice : 0

  // Save current item config and move to next coffret item
  const saveCurrentCoffretItem = () => {
    const config: ProductConfig = {
      productType: productType!,
      name,
      selectedColors: [...selectedColors],
      material,
      decorativeShapes: [...decorativeShapes],
      note,
    }
    const newConfigs = [...coffretConfigs]
    newConfigs[coffretItemIndex] = config
    setCoffretConfigs(newConfigs)
    return newConfigs
  }

  const goToNextCoffretItem = () => {
    const configs = saveCurrentCoffretItem()
    const nextIndex = coffretItemIndex + 1

    if (nextIndex < coffret!.items.length) {
      // More items to configure
      setCoffretItemIndex(nextIndex)
      setProductType(coffret!.items[nextIndex])

      // Load existing config if going back
      const existing = configs[nextIndex]
      if (existing) {
        setName(existing.name)
        setSelectedColors(existing.selectedColors)
        setMaterial(existing.material)
        setDecorativeShapes(existing.decorativeShapes)
        setNote(existing.note)
      } else {
        setName('')
        setSelectedColors([])
        setMaterial('silicone')
        setDecorativeShapes([])
        setNote('')
      }
      setStep(1) // Start at name for next item
    } else {
      // All items configured, go to final preview
      setStep(4)
    }
  }

  const goToPrevCoffretItem = () => {
    saveCurrentCoffretItem()
    const prevIndex = coffretItemIndex - 1
    setCoffretItemIndex(prevIndex)
    setProductType(coffret!.items[prevIndex])

    const existing = coffretConfigs[prevIndex]
    if (existing) {
      setName(existing.name)
      setSelectedColors(existing.selectedColors)
      setMaterial(existing.material)
      setDecorativeShapes(existing.decorativeShapes)
      setNote(existing.note)
    }
    setStep(3) // Go to last sub-step
  }

  const handleAddToCart = () => {
    if (isCoffret && coffret) {
      // Save final item config
      const allConfigs = saveCurrentCoffretItem()
      // Build combined description
      const descriptions = allConfigs.map((cfg, i) => {
        const pt = coffret.items[i]
        return buildDescription(pt, cfg)
      })
      const totalShapes = allConfigs.reduce((sum, c) => sum + c.decorativeShapes.length, 0)
      const finalPrice = coffret.price + totalShapes
      const allNames = allConfigs.map(c => c.name).join(' + ')

      addToCart({
        id: `coffret-${Date.now()}`,
        name: `${coffret.name} — ${allNames}`,
        price: finalPrice,
        image: '/images/logo-saumon.png',
        customDescription: descriptions.join(' | '),
        // Configuration complète : le serveur recalcule prix et description (08.10.2026)
        config: { kind: 'coffret', coffretId: coffret.id, items: allConfigs },
      })
      setAdded(true)
    } else if (product) {
      const desc = buildDescription(productType!, { name, selectedColors, material, decorativeShapes, note })
      addToCart({
        id: `custom-${Date.now()}`,
        name: `${product.name} — ${name}`,
        price: totalPrice,
        image: '/images/logo-saumon.png',
        customDescription: desc,
        // Configuration complète : le serveur recalcule prix et description (08.10.2026)
        config: { kind: 'perso', productType: productType!, name, selectedColors, material, decorativeShapes, note },
      })
      setAdded(true)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!productType || isCoffret
      case 1: return name.length >= 1
      case 2: return selectedColors.length >= 1
      case 3: return true
      case 4: return true
      default: return false
    }
  }

  const resetAll = () => {
    setStep(0)
    setProductType(null)
    setName('')
    setSelectedColors([])
    setMaterial('silicone')
    setDecorativeShapes([])
    setNote('')
    setAdded(false)
    setIsCoffret(false)
    setCoffret(null)
    setCoffretItemIndex(0)
    setCoffretConfigs([])
  }

  // For coffret: header showing which item we're configuring
  const coffretCurrentProduct = isCoffret && coffret ? PRODUCT_TYPES.find(p => p.id === coffret.items[coffretItemIndex]) : null

  return (
    <div className="min-h-screen bg-baby-cream">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <Image src="/images/logo-saumon.png" alt="Babyboo" width={64} height={64} className="w-14 h-14 mx-auto mb-3" />
          <h1 className="font-serif text-3xl md:text-4xl text-baby-text">Composez votre création</h1>
          <p className="text-baby-text/60 mt-2">Créez un produit unique, bead par bead</p>
        </div>
      </div>

      {/* Coffret badge */}
      {isCoffret && coffret && step > 0 && step < 4 && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-baby-rose/10 to-baby-pink/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="font-semibold text-baby-text text-sm">{coffret.name}</p>
                <p className="text-xs text-baby-text/50">
                  Article {coffretItemIndex + 1}/{coffret.items.length} : <span className="font-medium text-baby-rose">{coffretCurrentProduct?.name}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {coffret.items.map((item, i) => {
                const pt = PRODUCT_TYPES.find(p => p.id === item)
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      i === coffretItemIndex
                        ? 'bg-baby-rose text-white'
                        : i < coffretItemIndex || coffretConfigs[i]
                        ? 'bg-baby-brown text-white'
                        : 'bg-baby-text/10 text-baby-text/40'
                    }`}
                  >
                    {i < coffretItemIndex || coffretConfigs[i] ? '✓' : pt?.icon}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center space-x-1 text-xs md:text-sm font-medium transition ${
                i === step ? 'text-baby-rose' : i < step ? 'text-baby-brown cursor-pointer' : 'text-baby-text/30'
              }`}
            >
              <span className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? 'bg-baby-rose text-white' : i < step ? 'bg-baby-brown text-white' : 'bg-baby-text/10 text-baby-text/40'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
          ))}
        </div>
        <div className="w-full bg-baby-text/10 rounded-full h-1.5">
          <div
            className="bg-baby-rose h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Live Preview - always visible */}
      {step > 0 && step < 4 && composition.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 mb-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <p className="text-xs text-baby-text/40 text-center mb-3">Aperçu en direct{isCoffret && coffretCurrentProduct ? ` — ${coffretCurrentProduct.name}` : ''}</p>
            <div className="flex items-center justify-center gap-1 md:gap-1.5 flex-wrap py-4">
              {composition.map((bead, i) => (
                <div key={i} className="flex flex-col items-center">
                  {bead.type === 'clip' ? (
                    <div className="w-8 h-5 md:w-10 md:h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-md shadow-sm border border-gray-400" />
                  ) : bead.type === 'ring' ? (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-amber-700/70" />
                  ) : bead.type === 'letter' ? (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border-2 border-baby-text/20 flex items-center justify-center shadow-sm">
                      <span className="text-xs md:text-sm font-bold text-baby-text">{bead.value}</span>
                    </div>
                  ) : bead.type === 'shape' ? (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm text-lg" style={{ backgroundColor: bead.color || '#F8C8DC' }}>
                      {bead.value}
                    </div>
                  ) : bead.type === 'wood' ? (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #D4A373, #C8956C)' }} />
                  ) : (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" style={{ backgroundColor: bead.color || '#F8C8DC' }} />
                  )}
                </div>
              ))}
            </div>
            {product && (
              <p className="text-center text-sm text-baby-text/50 mt-2">
                {product.name} — <span className="font-bold text-baby-rose">
                  {isCoffret ? `Coffret ${coffret?.price.toFixed(2)} CHF` : `${totalPrice.toFixed(2)} CHF`}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">

          {/* Step 0: Product Type */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-2xl text-baby-text mb-2">Quel produit souhaitez-vous créer ?</h2>
              <p className="text-baby-text/50 text-sm mb-6">Choisissez le type de création</p>

              {/* Single products */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRODUCT_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => { setProductType(pt.id); setIsCoffret(false); setCoffret(null) }}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      productType === pt.id && !isCoffret
                        ? 'border-baby-rose bg-baby-rose/5'
                        : 'border-baby-brown/10 hover:border-baby-rose/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{pt.icon}</span>
                      <div>
                        <p className="font-semibold text-baby-text">{pt.name}</p>
                        <p className="text-xs text-baby-text/50">{pt.description}</p>
                        <p className="text-sm font-bold text-baby-rose mt-1">Dès {pt.basePrice.toFixed(2)} CHF</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Coffrets */}
              <div className="mt-8">
                <h3 className="font-serif text-lg text-baby-text mb-3 flex items-center gap-2">
                  <span className="text-xl">🎁</span> Coffrets cadeaux
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COFFRET_TYPES.map(ct => (
                    <button
                      key={ct.id}
                      onClick={() => {
                        setIsCoffret(true)
                        setCoffret(ct)
                        setProductType(ct.items[0])
                        setCoffretItemIndex(0)
                        setCoffretConfigs([])
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        isCoffret && coffret?.id === ct.id
                          ? 'border-baby-rose bg-baby-rose/5'
                          : 'border-baby-brown/10 hover:border-baby-rose/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{ct.icon}</span>
                        <div>
                          <p className="font-semibold text-baby-text">{ct.name}</p>
                          <p className="text-xs text-baby-text/50">{ct.description}</p>
                          <div className="flex gap-1 mt-1">
                            {ct.items.map((item, i) => {
                              const pt = PRODUCT_TYPES.find(p => p.id === item)
                              return (
                                <span key={i} className="text-xs bg-baby-beige px-2 py-0.5 rounded-full text-baby-text/70">
                                  {pt?.icon} {pt?.name}
                                </span>
                              )
                            })}
                          </div>
                          <p className="text-sm font-bold text-baby-rose mt-1">{ct.price.toFixed(2)} CHF</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-2xl text-baby-text mb-2">
                Quel prénom ?
                {isCoffret && coffretCurrentProduct && (
                  <span className="text-baby-rose text-lg ml-2">({coffretCurrentProduct.name})</span>
                )}
              </h2>
              <p className="text-baby-text/50 text-sm mb-6">Chaque lettre deviendra une perle</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ -]/g, '').slice(0, 16))}
                placeholder="Prénom de bébé"
                className="w-full px-6 py-4 text-2xl text-center font-serif rounded-xl border-2 border-baby-brown/20 focus:outline-none focus:border-baby-rose transition"
                autoFocus
              />
              <p className="text-center text-xs text-baby-text/40 mt-2">{name.length}/16 caractères max</p>

              {name.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                  {name.toUpperCase().split('').map((letter, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg bg-white border-2 border-baby-text/20 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-bold text-baby-text">{letter}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <h3 className="font-semibold text-baby-text mb-3">Matériaux</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'silicone' as Material, name: 'Silicone', desc: 'Alimentaire, sans BPA', icon: '🫧' },
                    { id: 'bois' as Material, name: 'Bois naturel', desc: 'Non traité, doux', icon: '🪵' },
                    { id: 'melange' as Material, name: 'Mélange', desc: 'Silicone + bois', icon: '✨' },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterial(m.id)}
                      className={`p-3 rounded-xl border-2 text-center transition ${
                        material === m.id
                          ? 'border-baby-rose bg-baby-rose/5'
                          : 'border-baby-brown/10 hover:border-baby-rose/30'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <p className="text-sm font-medium text-baby-text mt-1">{m.name}</p>
                      <p className="text-xs text-baby-text/40">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Colors */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-2xl text-baby-text mb-2">
                Choisissez vos couleurs
                {isCoffret && coffretCurrentProduct && (
                  <span className="text-baby-rose text-lg ml-2">({coffretCurrentProduct.name})</span>
                )}
              </h2>
              <p className="text-baby-text/50 text-sm mb-6">Sélectionnez 1 à 4 couleurs pour les perles</p>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {COLORS.map(color => {
                  const isSelected = selectedColors.includes(color.id)
                  const order = selectedColors.indexOf(color.id)
                  return (
                    <button
                      key={color.id}
                      onClick={() => toggleColor(color.id)}
                      className="flex flex-col items-center group"
                      title={color.name}
                    >
                      <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full shadow-sm transition-transform ${
                        isSelected ? 'ring-3 ring-baby-rose ring-offset-2 scale-110' : 'hover:scale-105'
                      }`} style={{ backgroundColor: color.hex }}>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-baby-rose text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {order + 1}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-baby-text/50 mt-1 text-center leading-tight">{color.name}</span>
                    </button>
                  )
                })}
              </div>

              {selectedColors.length > 0 && (
                <div className="mt-6 p-4 bg-baby-beige/50 rounded-xl">
                  <p className="text-sm text-baby-text/60 mb-2">Couleurs sélectionnées :</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedColors.map((cId) => {
                      const c = COLORS.find(co => co.id === cId)
                      return (
                        <div key={cId} className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c?.hex }} />
                          <span className="text-sm text-baby-text">{c?.name}</span>
                          <button onClick={() => toggleColor(cId)} className="text-baby-text/30 hover:text-red-500 text-xs">✕</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Composition / Decorative elements */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-2xl text-baby-text mb-2">
                Ajoutez des formes décoratives
                {isCoffret && coffretCurrentProduct && (
                  <span className="text-baby-rose text-lg ml-2">({coffretCurrentProduct.name})</span>
                )}
              </h2>
              <p className="text-baby-text/50 text-sm mb-6">Personnalisez avec des perles en forme (optionnel, +1 CHF/forme)</p>

              <div className="space-y-6">
                {/* Before name */}
                <div>
                  <h3 className="text-sm font-medium text-baby-text mb-2">Avant le prénom</h3>
                  <div className="flex flex-wrap gap-2">
                    {SHAPES.map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => addShape(shape.id, 'before')}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-baby-brown/10 hover:border-baby-rose/30 hover:bg-baby-rose/5 transition text-sm"
                      >
                        <span>{shape.emoji}</span>
                        <span className="text-baby-text/70">{shape.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* After name */}
                <div>
                  <h3 className="text-sm font-medium text-baby-text mb-2">Après le prénom</h3>
                  <div className="flex flex-wrap gap-2">
                    {SHAPES.map(shape => (
                      <button
                        key={shape.id}
                        onClick={() => addShape(shape.id, 'after')}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-baby-brown/10 hover:border-baby-rose/30 hover:bg-baby-rose/5 transition text-sm"
                      >
                        <span>{shape.emoji}</span>
                        <span className="text-baby-text/70">{shape.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current decorations */}
                {decorativeShapes.length > 0 && (
                  <div className="p-4 bg-baby-beige/50 rounded-xl">
                    <p className="text-sm font-medium text-baby-text mb-2">Formes ajoutées :</p>
                    <div className="flex flex-wrap gap-2">
                      {decorativeShapes.map((d, i) => {
                        const shape = SHAPES.find(s => s.id === d.shape)
                        return (
                          <div key={i} className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 shadow-sm text-sm">
                            <span>{shape?.emoji}</span>
                            <span className="text-baby-text">{shape?.name}</span>
                            <span className="text-baby-text/40">({d.position === 'before' ? 'avant' : d.position === 'after' ? 'après' : 'entre'})</span>
                            <button onClick={() => removeShape(i)} className="text-baby-text/30 hover:text-red-500">✕</button>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-baby-rose mt-2">+{decorativeShapes.length}.00 CHF</p>
                  </div>
                )}

                {/* Note */}
                <div>
                  <h3 className="text-sm font-medium text-baby-text mb-2">Note particulière (optionnel)</h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Précisions, souhaits, couleur particulière..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Final Preview & Add to Cart */}
          {step === 4 && (
            <div>
              <h2 className="font-serif text-2xl text-baby-text mb-6 text-center">
                {isCoffret ? 'Votre coffret est prêt !' : 'Votre création est prête !'}
              </h2>

              {added ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="font-serif text-xl text-baby-text mb-2">Ajouté au panier !</h3>
                  <p className="text-baby-text/60 mb-6">
                    {isCoffret ? 'Votre coffret personnalisé a été ajouté.' : 'Votre création personnalisée a été ajoutée.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/panier" className="btn-primary">
                      Voir le panier
                    </Link>
                    <button onClick={resetAll} className="btn-secondary">
                      Créer une autre
                    </button>
                  </div>
                </div>
              ) : isCoffret && coffret ? (
                /* Coffret final preview */
                <div>
                  {/* Show all configured items */}
                  {coffret.items.map((itemType, idx) => {
                    const config = idx === coffretItemIndex
                      ? { productType, name, selectedColors, material, decorativeShapes, note }
                      : coffretConfigs[idx]
                    if (!config) return null
                    const pt = PRODUCT_TYPES.find(p => p.id === itemType)
                    const itemComposition = buildComposition(itemType, config.name, config.selectedColors, config.material, config.decorativeShapes)

                    return (
                      <div key={idx} className="mb-6 p-4 bg-baby-beige/30 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-serif text-lg text-baby-text flex items-center gap-2">
                            <span>{pt?.icon}</span> {pt?.name}
                          </h3>
                          <button
                            onClick={() => {
                              saveCurrentCoffretItem()
                              setCoffretItemIndex(idx)
                              setProductType(itemType)
                              const cfg = idx === coffretItemIndex
                                ? { name, selectedColors, material, decorativeShapes, note }
                                : coffretConfigs[idx]
                              if (cfg) {
                                setName(cfg.name)
                                setSelectedColors(cfg.selectedColors)
                                setMaterial(cfg.material)
                                setDecorativeShapes(cfg.decorativeShapes)
                                setNote(cfg.note)
                              }
                              setStep(1)
                            }}
                            className="text-sm text-baby-rose hover:underline"
                          >
                            Modifier
                          </button>
                        </div>

                        {/* Mini preview */}
                        <div className="flex items-center justify-center gap-1 flex-wrap py-2 mb-3">
                          {itemComposition.map((bead, i) => (
                            <div key={i}>
                              {bead.type === 'clip' ? (
                                <div className="w-6 h-4 bg-gradient-to-b from-gray-300 to-gray-400 rounded-sm border border-gray-400" />
                              ) : bead.type === 'ring' ? (
                                <div className="w-6 h-6 rounded-full border-3 border-amber-700/70" />
                              ) : bead.type === 'letter' ? (
                                <div className="w-6 h-6 rounded bg-white border border-baby-text/20 flex items-center justify-center shadow-sm">
                                  <span className="text-[10px] font-bold text-baby-text">{bead.value}</span>
                                </div>
                              ) : bead.type === 'shape' ? (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: bead.color || '#F8C8DC' }}>
                                  {bead.value}
                                </div>
                              ) : bead.type === 'wood' ? (
                                <div className="w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #D4A373, #C8956C)' }} />
                              ) : (
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: bead.color || '#F8C8DC' }} />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-baby-text/50">Prénom:</span> <span className="font-medium">{config.name}</span></div>
                          <div><span className="text-baby-text/50">Matériau:</span> <span className="font-medium">{config.material === 'silicone' ? 'Silicone' : config.material === 'bois' ? 'Bois' : 'Mélange'}</span></div>
                          <div className="flex items-center gap-1">
                            <span className="text-baby-text/50">Couleurs:</span>
                            {config.selectedColors.map(cId => {
                              const c = COLORS.find(co => co.id === cId)
                              return <div key={cId} className="w-4 h-4 rounded-full" style={{ backgroundColor: c?.hex }} title={c?.name} />
                            })}
                          </div>
                          {config.decorativeShapes.length > 0 && (
                            <div>
                              <span className="text-baby-text/50">Formes:</span>{' '}
                              {config.decorativeShapes.map(d => SHAPES.find(s => s.id === d.shape)?.emoji).join(' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Price */}
                  <div className="bg-baby-beige/50 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-baby-text">Prix coffret</span>
                      <span>{coffret.price.toFixed(2)} CHF</span>
                    </div>
                    {coffretTotalPrice > coffret.price && (
                      <div className="flex justify-between items-center mt-1 text-sm text-baby-text/60">
                        <span>Formes décoratives</span>
                        <span>+{(coffretTotalPrice - coffret.price).toFixed(2)} CHF</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-baby-brown/20 text-xl font-bold text-baby-rose">
                      <span>Total</span>
                      <span>{coffretTotalPrice.toFixed(2)} CHF</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl mb-6 text-sm">
                    <span className="text-lg">🌿</span>
                    <p className="text-green-800">
                      Tous nos matériaux sont sûrs pour bébé : silicone alimentaire sans BPA, bois naturel non traité. Chaque création est faite main en Suisse.
                    </p>
                  </div>

                  <button onClick={handleAddToCart} className="btn-primary w-full text-lg py-4">
                    Ajouter le coffret au panier — {coffretTotalPrice.toFixed(2)} CHF
                  </button>
                </div>
              ) : (
                /* Single product final preview */
                <div>
                  {/* Summary */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                      <span className="text-baby-text/60">Produit</span>
                      <span className="font-medium text-baby-text">{product?.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                      <span className="text-baby-text/60">Prénom</span>
                      <span className="font-medium text-baby-text">{name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                      <span className="text-baby-text/60">Matériaux</span>
                      <span className="font-medium text-baby-text">
                        {material === 'silicone' ? 'Silicone alimentaire' : material === 'bois' ? 'Bois naturel' : 'Mélange silicone + bois'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                      <span className="text-baby-text/60">Couleurs</span>
                      <div className="flex gap-1">
                        {selectedColors.map(cId => {
                          const c = COLORS.find(co => co.id === cId)
                          return <div key={cId} className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: c?.hex }} title={c?.name} />
                        })}
                      </div>
                    </div>
                    {decorativeShapes.length > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                        <span className="text-baby-text/60">Décorations</span>
                        <span className="font-medium text-baby-text">
                          {decorativeShapes.map(d => SHAPES.find(s => s.id === d.shape)?.emoji).join(' ')}
                        </span>
                      </div>
                    )}
                    {note && (
                      <div className="flex justify-between items-center py-2 border-b border-baby-brown/10">
                        <span className="text-baby-text/60">Note</span>
                        <span className="text-sm text-baby-text max-w-[200px] text-right">{note}</span>
                      </div>
                    )}
                  </div>

                  {/* Composition preview */}
                  <div className="flex items-center justify-center gap-1 md:gap-1.5 flex-wrap py-4 mb-6">
                    {composition.map((bead, i) => (
                      <div key={i} className="flex flex-col items-center">
                        {bead.type === 'clip' ? (
                          <div className="w-8 h-5 md:w-10 md:h-6 bg-gradient-to-b from-gray-300 to-gray-400 rounded-md shadow-sm border border-gray-400" />
                        ) : bead.type === 'ring' ? (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-amber-700/70" />
                        ) : bead.type === 'letter' ? (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border-2 border-baby-text/20 flex items-center justify-center shadow-sm">
                            <span className="text-xs md:text-sm font-bold text-baby-text">{bead.value}</span>
                          </div>
                        ) : bead.type === 'shape' ? (
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm text-lg" style={{ backgroundColor: bead.color || '#F8C8DC' }}>
                            {bead.value}
                          </div>
                        ) : bead.type === 'wood' ? (
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #D4A373, #C8956C)' }} />
                        ) : (
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" style={{ backgroundColor: bead.color || '#F8C8DC' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Price */}
                  <div className="bg-baby-beige/50 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-baby-text">Prix de base</span>
                      <span>{product?.basePrice.toFixed(2)} CHF</span>
                    </div>
                    {decorativeShapes.length > 0 && (
                      <div className="flex justify-between items-center mt-1 text-sm text-baby-text/60">
                        <span>Formes décoratives (x{decorativeShapes.length})</span>
                        <span>+{decorativeShapes.length}.00 CHF</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-baby-brown/20 text-xl font-bold text-baby-rose">
                      <span>Total</span>
                      <span>{totalPrice.toFixed(2)} CHF</span>
                    </div>
                  </div>

                  {/* Safety note */}
                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl mb-6 text-sm">
                    <span className="text-lg">🌿</span>
                    <p className="text-green-800">
                      Tous nos matériaux sont sûrs pour bébé : silicone alimentaire sans BPA, bois naturel non traité. Chaque création est faite main en Suisse.
                    </p>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="btn-primary w-full text-lg py-4"
                  >
                    Ajouter au panier — {totalPrice.toFixed(2)} CHF
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {!added && (
            <div className="flex justify-between mt-8 pt-6 border-t border-baby-brown/10">
              {step > 0 ? (
                <button
                  onClick={() => {
                    // For coffret: if at step 1 and not first item, go back to previous item's step 3
                    if (isCoffret && step === 1 && coffretItemIndex > 0) {
                      goToPrevCoffretItem()
                    } else if (step === 1 && (typeParam && (SLUG_TO_TYPE[typeParam] || SLUG_TO_COFFRET[typeParam]))) {
                      // If came from product page, back goes to product page
                      window.history.back()
                    } else {
                      setStep(step - 1)
                    }
                  }}
                  className="px-6 py-3 rounded-full border border-baby-brown/20 text-baby-text hover:bg-baby-beige transition"
                >
                  ← Retour
                </button>
              ) : (
                <div />
              )}
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => {
                    if (!canProceed()) return
                    // For coffret: after step 3, move to next item or final preview
                    if (isCoffret && step === 3) {
                      goToNextCoffretItem()
                    } else {
                      setStep(step + 1)
                    }
                  }}
                  disabled={!canProceed()}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isCoffret && step === 3 && coffretItemIndex < (coffret?.items.length || 1) - 1
                    ? `Suivant : ${PRODUCT_TYPES.find(p => p.id === coffret?.items[coffretItemIndex + 1])?.name} →`
                    : 'Continuer →'
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PersonnaliserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-baby-cream flex items-center justify-center">
        <div className="text-center">
          <Image src="/images/logo-saumon.png" alt="Babyboo" width={64} height={64} className="w-14 h-14 mx-auto mb-3 animate-pulse" />
          <p className="text-baby-text/50">Chargement...</p>
        </div>
      </div>
    }>
      <PersonnaliserContent />
    </Suspense>
  )
}
