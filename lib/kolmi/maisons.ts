import { supabase } from '@/lib/supabase'
import {
  dnaCategories as staticDnaCategories,
  type DnaCategory,
  type DnaCategoryId,
} from '@/data/kolmiDna'

type MaisonRow = {
  id: DnaCategoryId
  label: string
  maison: string
  title: string
  subtitle: string
  description: string
  traits: string[]
  axis_intensity: 'ardent' | 'calm'
  axis_rhythm: 'fast' | 'slow'
  axis_openness: 'open' | 'selective'
  compatible: DnaCategoryId[]
}

function rowToCategory(row: MaisonRow): DnaCategory {
  return {
    id: row.id,
    label: row.label,
    maison: row.maison,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    traits: row.traits,
    axes: {
      intensity: row.axis_intensity,
      rhythm: row.axis_rhythm,
      openness: row.axis_openness,
    },
    compatible: row.compatible,
  }
}

// Fetch les 8 Maisons depuis Supabase. Fallback sur le contenu statique
// de data/kolmiDna.ts en cas d'erreur réseau ou de DB vide.
export async function fetchMaisons(): Promise<Record<DnaCategoryId, DnaCategory>> {
  const { data, error } = await supabase
    .from('maisons')
    .select(
      'id, label, maison, title, subtitle, description, traits, axis_intensity, axis_rhythm, axis_openness, compatible',
    )

  if (error || !data || data.length === 0) {
    if (error) console.warn('[kolmi] fetchMaisons error, fallback to static', error.message)
    return staticDnaCategories
  }

  const rows = data as MaisonRow[]
  const result = {} as Record<DnaCategoryId, DnaCategory>
  for (const row of rows) {
    result[row.id] = rowToCategory(row)
  }
  return result
}
