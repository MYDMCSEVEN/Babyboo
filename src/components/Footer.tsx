import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-baby-beige border-t border-baby-brown/10 mt-16">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
        {/* Top section: Big logo centered */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10 md:mb-14">
          <Link href="/" className="mb-3 sm:mb-4">
            <Image
              src="/images/logo-saumon.png"
              alt="Babyboo Créations"
              width={240}
              height={240}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40"
            />
          </Link>
          <p className="text-baby-text/60 text-sm max-w-xs sm:max-w-md leading-relaxed px-4">
            Accessoires faits main pour bébés, créés avec amour en Suisse par deux soeurs.
          </p>
        </div>

        {/* Links — single column on mobile, 3 cols on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12 max-w-3xl mx-auto">
          {/* Navigation */}
          <div className="text-center">
            <h4 className="font-serif text-baby-text font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Navigation</h4>
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 sm:flex-col sm:space-y-2 sm:gap-0 text-sm">
              <li><Link href="/boutique" className="text-baby-text/60 hover:text-baby-rose transition">Boutique</Link></li>
              <li><Link href="/notre-histoire" className="text-baby-text/60 hover:text-baby-rose transition">Notre Histoire</Link></li>
              <li><Link href="/contact" className="text-baby-text/60 hover:text-baby-rose transition">Contact</Link></li>
              <li><Link href="/mentions-legales" className="text-baby-text/60 hover:text-baby-rose transition">Mentions légales</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center">
            <h4 className="font-serif text-baby-text font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Contact</h4>
            <div className="text-sm text-baby-text/60 space-y-1.5 sm:space-y-2.5">
              <p>
                <a href="mailto:info@babyboo-creations.ch" className="hover:text-baby-rose transition break-all sm:break-normal">
                  info@babyboo-creations.ch
                </a>
              </p>
              <p>
                <a href="tel:+41792704105" className="hover:text-baby-rose transition">
                  079 270 41 05
                </a>
              </p>
              <p>Fully, Valais — Suisse</p>
            </div>
          </div>

          {/* Social / Nous suivre */}
          <div className="text-center">
            <h4 className="font-serif text-baby-text font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Nous suivre</h4>
            <div className="flex justify-center gap-4 sm:flex-col sm:items-center sm:gap-3">
              <a
                href="https://www.instagram.com/babyboo.creationss/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-baby-text/60 hover:text-baby-rose text-sm transition group"
              >
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <span>@babyboo.creationss</span>
              </a>
              <a
                href="https://wa.me/41792704105"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-baby-text/60 hover:text-[#25D366] text-sm transition group"
              >
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-baby-brown/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between text-xs text-baby-text/40">
          <p>&copy; {new Date().getFullYear()} Babyboo Créations. Tous droits réservés.</p>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <Link href="/mentions-legales" className="hover:text-baby-text/60 transition">Mentions légales</Link>
            <span className="hidden sm:inline">·</span>
            <p className="hidden sm:block">Fait main avec amour en Suisse</p>
            <Link href="/admin" className="text-baby-text/20 hover:text-baby-text/40 transition">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
