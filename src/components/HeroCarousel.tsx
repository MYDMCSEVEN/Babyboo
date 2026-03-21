'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  {
    src: '/images/hero-1.jpg',
    alt: 'Bébé avec attache-lolette personnalisée Babyboo Créations',
  },
  {
    src: '/images/hero-2.jpg',
    alt: 'Bébé souriant avec accessoire en bois et silicone Babyboo Créations',
  },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full overflow-hidden">
      {/* Images */}
      <div className="relative w-full aspect-[16/7] md:aspect-[16/6]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end pb-12 md:pb-16 justify-center">
          <div className="text-center px-4 max-w-3xl">
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-4 drop-shadow-lg">
              Des créations faites main,{' '}
              <span className="text-baby-pink">avec amour</span>
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-6 max-w-xl mx-auto drop-shadow">
              Accessoires uniques en bois et silicone, personnalisables et fabriqués en Suisse.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/boutique" className="btn-primary text-base md:text-lg">
                Découvrir la boutique
              </Link>
              <Link href="/notre-histoire" className="btn-secondary text-base md:text-lg !bg-white/90 !text-baby-text hover:!bg-white">
                Notre histoire
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === current ? 'bg-white w-6' : 'bg-white/50'
            }`}
            aria-label={`Image ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
