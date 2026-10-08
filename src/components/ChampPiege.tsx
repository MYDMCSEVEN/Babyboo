'use client'

// Champ piège anti-robot (08.10.2026) : invisible et ignoré par les humains
// (hors écran, hors tabulation, caché aux lecteurs d'écran). Un robot qui
// remplit tous les champs le remplit aussi : le serveur ignore alors la demande.
import { CHAMP_PIEGE } from '@/lib/champ-piege'

export default function ChampPiege({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <input
        type="text"
        name={CHAMP_PIEGE}
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
