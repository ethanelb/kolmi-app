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
    neighborhood: '1ᵉʳ',
    type: 'bar à vin',
  },
  // ─── Élargissement du carnet pour le sélecteur de créneaux ───────
  {
    id: 'septime-la-cave',
    name: 'Septime La Cave',
    address: '3 Rue Basfroi',
    city: 'Paris',
    ambiance: 'On y parle bas, on y reste tard. Vins sélectionnés à la main.',
    matchmakerNote: 'Pour un premier verre qui glisse vers un dîner long.',
    neighborhood: '11ᵉ',
    type: 'bar à vin',
  },
  {
    id: 'le-petit-vendome',
    name: 'Le Petit Vendôme',
    address: '8 Rue des Capucines',
    city: 'Paris',
    ambiance: 'Comptoir, jambon-beurre, pas de chichi.',
    matchmakerNote: 'Quand l\'idée est de voir si la conversation tient sans décor.',
    neighborhood: '2ᵉ',
    type: 'restaurant',
  },
  {
    id: 'cafe-rome-lyon',
    name: 'Café Rome',
    address: '14 Place Sathonay',
    city: 'Lyon',
    ambiance: 'Terrasse au calme, vue sur les toits.',
    matchmakerNote: 'Pour les après-midi qui ne pressent pas.',
    neighborhood: 'Croix-Rousse',
    type: 'café',
  },
  {
    id: 'le-sirius-lyon',
    name: 'Le Sirius',
    address: 'Quai Augagneur',
    city: 'Lyon',
    ambiance: 'Bar à péniche, on regarde l\'eau.',
    matchmakerNote: 'Cadre singulier, propice aux silences partagés.',
    neighborhood: 'Berges du Rhône',
    type: 'bar à vin',
  },
  {
    id: 'la-mercerie-marseille',
    name: 'La Mercerie',
    address: '9 Cours Saint-Louis',
    city: 'Marseille',
    ambiance: 'Cuisine d\'instinct, premier service à 19h30.',
    matchmakerNote: 'Pour ceux qui prennent le repas comme une discussion.',
    neighborhood: 'Noailles',
    type: 'restaurant',
  },
  {
    id: 'cafe-zoe-marseille',
    name: 'Café Zoé',
    address: '6 Rue du Petit Puits',
    city: 'Marseille',
    ambiance: 'Petite salle aux murs ocre, terrasse abritée.',
    matchmakerNote: 'Discret, idéal pour un café de première fois.',
    neighborhood: 'Le Panier',
    type: 'café',
  },
  {
    id: 'le-symbiose-bordeaux',
    name: 'Le Symbiose',
    address: '4 Quai des Chartrons',
    city: 'Bordeaux',
    ambiance: 'Cocktails sérieux, derrière une porte de poissonnerie.',
    matchmakerNote: 'Le bar caché qui sert d\'introduction au quartier.',
    neighborhood: 'Chartrons',
    type: 'bar à vin',
  },
]

export function getVenueById(id: string): Venue | undefined {
  return mockVenues.find((v) => v.id === id)
}

// Filtre les lieux par ville. Si la ville n'a pas de lieu seedé, on
// retombe sur la liste complète pour ne jamais bloquer le sélecteur.
export function venuesByCity(city: string): Venue[] {
  const list = mockVenues.filter((v) => v.city === city)
  return list.length > 0 ? list : mockVenues
}
