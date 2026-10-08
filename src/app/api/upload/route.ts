import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { estAdmin } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

// Sécurité (07.10.2026) : dépôt réservé à l'admin connecté, images seulement.
const TYPES_AUTORISES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}
// Vercel refuse de toute façon les requêtes de plus de 4,5 Mo.
const TAILLE_MAX = 4.5 * 1024 * 1024

export async function POST(req: NextRequest) {
  if (!(await estAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })
  }

  const extension = TYPES_AUTORISES[file.type]
  if (!extension) {
    return NextResponse.json(
      { error: 'Format refusé : images JPG, PNG, WebP, GIF ou AVIF uniquement' },
      { status: 415 }
    )
  }

  if (file.size === 0 || file.size > TAILLE_MAX) {
    return NextResponse.json({ error: 'Image trop lourde (4,5 Mo maximum)' }, { status: 413 })
  }

  // Nom de fichier nettoyé : pas de chemin ni de caractère spécial
  const base = (file.name || 'image')
    .replace(/\.[^.]*$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image'

  const blob = await put(`babyboo/${Date.now()}-${base}.${extension}`, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
