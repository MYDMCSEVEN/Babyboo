'use client'

import { useState } from 'react'
import { addToCart } from '@/lib/cart'

interface Props {
  id: string
  name: string
  price: number
  image: string
}

export default function AddToCartButton({ id, name, price, image }: Props) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart({ id, name, price, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full py-4 rounded-full font-semibold text-lg transition-all duration-300 ${
        added
          ? 'bg-green-500 text-white'
          : 'bg-baby-rose text-white hover:bg-baby-rose/80'
      }`}
    >
      {added ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
    </button>
  )
}
