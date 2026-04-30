import type { Venue } from '@/lib/kolmi/types'

export const mockVenues: Venue[] = [
  {
    id: 'cafe-nuances',
    name: 'Café Nuances',
    address: '25 Rue Danielle Casanova',
    city: 'Paris',
    ambiance:
      'Café discret, élégant, idéal pour une première rencontre calme.',
    matchmakerNote:
      'Choisi pour sa discrétion, son niveau sonore modéré et sa proximité avec vos deux zones.',
  },
  {
    id: 'hotel-particulier-montmartre',
    name: 'Hôtel Particulier Montmartre',
    address: '23 Avenue Junot',
    city: 'Paris',
    ambiance:
      'Salon feutré, lumière basse, bar à cocktails — pour une rencontre déjà un peu nocturne.',
    matchmakerNote:
      'Idéal pour deux profils qui aiment les conversations qui durent et un cadre tenu.',
  },
  {
    id: 'le-fumoir',
    name: 'Le Fumoir',
    address: '6 Rue de l\'Amiral de Coligny',
    city: 'Paris',
    ambiance:
      'Bar-bibliothèque, ambiance feutrée mais ouverte, pour parler longtemps.',
    matchmakerNote:
      'Le bon choix quand l\'enjeu est le dialogue plutôt que la mise en scène.',
  },
]

export function getVenueById(id: string): Venue | undefined {
  return mockVenues.find((v) => v.id === id)
}
