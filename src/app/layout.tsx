import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: {
    default: 'Babyboo Créations | Accessoires faits main pour bébés',
    template: '%s | Babyboo Créations',
  },
  description: 'Accessoires artisanaux pour bébés, faits main en Suisse avec amour par deux soeurs. Attache-lolettes, hochets, porte-clés personnalisés en bois et silicone.',
  keywords: ['babyboo', 'créations', 'accessoires bébé', 'fait main', 'suisse', 'attache-lolette', 'hochet', 'porte-clés', 'cadeau naissance', 'personnalisé', 'bois', 'silicone'],
  authors: [{ name: 'Babyboo Créations' }],
  openGraph: {
    title: 'Babyboo Créations | Accessoires faits main pour bébés',
    description: 'Accessoires artisanaux pour bébés, faits main en Suisse avec amour. Personnalisables, en bois et silicone alimentaire.',
    url: 'https://babyboo-creations.ch',
    siteName: 'Babyboo Créations',
    locale: 'fr_CH',
    type: 'website',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  metadataBase: new URL('https://babyboo-creations.ch'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
