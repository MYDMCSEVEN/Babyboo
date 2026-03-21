import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-baby-beige border-t border-baby-brown/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo + description */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image src="/images/logo-saumon.png" alt="Babyboo Créations" width={56} height={56} className="w-12 h-12 md:w-14 md:h-14" />
              <span className="font-serif text-lg text-baby-text font-bold">Babyboo Créations</span>
            </Link>
            <p className="text-baby-text/70 text-sm leading-relaxed">
              Accessoires faits main pour bébés, créés avec amour en Suisse par deux soeurs.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-baby-text mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/boutique" className="text-baby-text/70 hover:text-baby-brown transition">Boutique</Link></li>
              <li><Link href="/notre-histoire" className="text-baby-text/70 hover:text-baby-brown transition">Notre Histoire</Link></li>
              <li><Link href="/contact" className="text-baby-text/70 hover:text-baby-brown transition">Contact</Link></li>
              <li><Link href="/mentions-legales" className="text-baby-text/70 hover:text-baby-brown transition">Mentions légales</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-baby-text mb-4">Contact</h4>
            <div className="text-sm text-baby-text/70 space-y-2">
              <p>Email: info@babyboo-creations.ch</p>
              <p>Tél: 079 270 41 01</p>
              <p className="pt-1">Fully, Valais — Suisse</p>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-baby-text mb-4">Nous suivre</h4>
            <a
              href="https://www.instagram.com/babyboo.creationss/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-baby-text/70 hover:text-baby-brown text-sm transition"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>@babyboo.creationss</span>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-baby-brown/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-baby-text/50">
          <div className="flex items-center space-x-3">
            <Image src="/images/logo-saumon.png" alt="" width={24} height={24} className="w-6 h-6 opacity-50" />
            <p>&copy; {new Date().getFullYear()} Babyboo Créations. Tous droits réservés.</p>
          </div>
          <p>Fait main avec amour en Suisse 🇨🇭</p>
        </div>
      </div>
    </footer>
  )
}
