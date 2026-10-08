/**
 * Template registry: key → renderer + catalog metadata.
 *
 * Keys must match the backend catalog seeded by
 * `templates_app/migrations/0002_seed_templates.py` and
 * `templates_app/migrations/0003_seed_wedding_templates.py`. Rendering is pure
 * front-end code; template `config` from the API is never executed.
 */
import { ArcheSoleil } from './ArcheSoleil.tsx'
import { Confetti } from './Confetti.tsx'
import { EterniteOr } from './EterniteOr.tsx'
import { HeritageLuxe } from './HeritageLuxe.tsx'
import { JardinFloral } from './JardinFloral.tsx'
import { JardinOlive } from './JardinOlive.tsx'
import { LigneModerne } from './LigneModerne.tsx'
import { Memoire } from './Memoire.tsx'
import { NuitCeleste } from './NuitCeleste.tsx'
import { SceauAcademique } from './SceauAcademique.tsx'
import { SoireeFormelle } from './SoireeFormelle.tsx'
import type { InvitationDraft, TemplateDefinition } from './types.ts'

export const TEMPLATES: TemplateDefinition[] = [
  {
    key: 'heritage-luxe',
    name: 'Héritage',
    category: 'wedding',
    categoryLabel: 'Mariage',
    description: 'Composition classique et centrée, typographie serif et filets dorés.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: HeritageLuxe,
  },
  {
    key: 'eternite-or',
    name: 'Éternité',
    category: 'wedding',
    categoryLabel: 'Mariage',
    description: 'Art déco noir et or : cadre doré, éventails géométriques et titrage champagne.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: EterniteOr,
  },
  {
    key: 'jardin-olive',
    name: 'Jardin d’Olive',
    category: 'wedding',
    categoryLabel: 'Mariage',
    description: 'Botanique d’art : branches d’olivier dessinées à la main et photo en arche.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: JardinOlive,
  },
  {
    key: 'arche-soleil',
    name: 'Arche Soleil',
    category: 'wedding',
    categoryLabel: 'Mariage',
    description: 'Bohème chic terracotta : grande arche, soleil levant et vagues dessinées.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: ArcheSoleil,
  },
  {
    key: 'nuit-celeste',
    name: 'Nuit Céleste',
    category: 'wedding',
    categoryLabel: 'Mariage',
    description: 'Minuit étoilé : éclats d’or, croissant de lune et cadre céleste.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: NuitCeleste,
  },
  {
    key: 'jardin-floral',
    name: 'Jardin',
    category: 'anniversary',
    categoryLabel: 'Anniversaire de mariage',
    description: 'Décor floral délicat, tons poudrés et titrage romantique.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: JardinFloral,
  },
  {
    key: 'ligne-moderne',
    name: 'Ligne moderne',
    category: 'corporate',
    categoryLabel: 'Entreprise',
    description: 'Grille contemporaine, typographie serrée, aucune image superflue.',
    supportsCover: false,
    emphasisFields: ['title', 'message', 'date', 'venue'],
    Component: LigneModerne,
  },
  {
    key: 'confetti',
    name: 'Confetti',
    category: 'birthday',
    categoryLabel: 'Anniversaire',
    description: 'Anniversaire festif, couleurs franches et titrage joyeux.',
    supportsCover: true,
    emphasisFields: ['title', 'date'],
    Component: Confetti,
  },
  {
    key: 'sceau-academique',
    name: 'Sceau académique',
    category: 'graduation',
    categoryLabel: 'Remise de diplômes',
    description: 'Marine et or, mise en page solennelle pour les grandes cérémonies.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: SceauAcademique,
  },
  {
    key: 'soiree-formelle',
    name: 'Soirée',
    category: 'reception',
    categoryLabel: 'Réception / cérémonie',
    description: 'Réception du soir : fond profond, titrage clair et élégant.',
    supportsCover: true,
    emphasisFields: ['title', 'date', 'venue'],
    Component: SoireeFormelle,
  },
  {
    key: 'memoire',
    name: 'Mémoire',
    category: 'memorial',
    categoryLabel: 'Hommage',
    description: 'Hommage sobre et lumineux, composition apaisée et discrète.',
    supportsCover: false,
    emphasisFields: ['title', 'date'],
    Component: Memoire,
  },
]

export function getTemplate(key: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.key === key)
}

export function emptyDraft(overrides: Partial<InvitationDraft> = {}): InvitationDraft {
  return {
    title: '',
    message: '',
    event_date: '',
    event_time: '',
    timezone: 'Africa/Kinshasa',
    venue_name: '',
    venue_address: '',
    venue_details: '',
    cover_url: null,
    coverTitle: '',
    emphasis: [],
    dressCode: [],
    program: [],
    ...overrides,
  }
}

const SAMPLES: Record<string, Partial<InvitationDraft>> = {
  'heritage-luxe': {
    title: 'Mariage de Grâce et Éric',
    message: 'Nous serions honorés de votre présence pour célébrer notre union.',
    venue_name: 'Cathédrale Notre-Dame',
    venue_address: 'Avenue de la Paix, Kinshasa',
    venue_details: 'Tenue de cérémonie souhaitée',
  },
  'eternite-or': {
    title: 'Le Mariage de Camille & Antoine',
    message: 'Entourez-nous de votre présence pour une soirée d’exception.',
    venue_name: 'Domaine de la Roseraie',
    venue_address: '12 allée des Tilleuls, 69000 Lyon',
    venue_details: 'Dîner et danse jusqu’à l’aube',
  },
  'jardin-olive': {
    title: 'Le Mariage de Léa & Gabriel',
    message: 'Nous vous convions à célébrer notre amour, sous les oliviers.',
    venue_name: 'Mas des Oliviers',
    venue_address: 'Chemin de Sainte-Victoire, 13100 Aix-en-Provence',
    venue_details: 'Cérémonie en plein air',
  },
  'arche-soleil': {
    title: 'Le Mariage de Inès & Samir',
    message: 'Venez partager avec nous une journée ensoleillée et inoubliable.',
    venue_name: 'Villa Azur',
    venue_address: 'Route des Crêtes, 06600 Antibes',
    venue_details: 'Cocktail au coucher du soleil',
  },
  'nuit-celeste': {
    title: 'Le Mariage de Sarah & Elias',
    message: 'Sous les étoiles, nous vous invitons à célébrer notre union.',
    venue_name: 'Observatoire du Belvédère',
    venue_address: '18 rue des Étoiles, 75019 Paris',
    venue_details: 'Dîner aux chandelles',
  },
  'jardin-floral': {
    title: 'Nos 20 ans de mariage',
    message: 'Rejoignez-nous pour une soirée fleurie en famille et entre amis.',
    venue_name: 'Jardin de la Roseraie',
    venue_address: 'Boulevard du 30 Juin, Kinshasa',
    venue_details: 'Cocktail en plein air',
  },
  'ligne-moderne': {
    title: 'Ouverture du siège de Kinshasa',
    message: 'Nous avons le plaisir de vous convier à cette étape marquante.',
    venue_name: 'Tour du Fleuve',
    venue_address: 'Avenue du Fleuve, Kinshasa',
    venue_details: 'Accueil dès 17h',
  },
  confetti: {
    title: 'Les 30 ans de Sarah',
    message: 'Une soirée festive vous attend : musique, gâteau et surprises !',
    venue_name: 'Le Palmier',
    venue_address: 'Avenue Kasa-Vubu, Kinshasa',
    venue_details: 'Apportez votre bonne humeur',
  },
  'sceau-academique': {
    title: 'Cérémonie de remise des diplômes',
    message: "Nous célébrons ensemble la réussite de la promotion 2026.",
    venue_name: 'Auditorium de l’Université',
    venue_address: 'Campus de Mont-Ngafula, Kinshasa',
    venue_details: 'Invitation nominative',
  },
  'soiree-formelle': {
    title: 'Soirée de gala caritative',
    message: 'Une soirée d’exception au profit des jeunes entrepreneurs.',
    venue_name: 'Hôtel Pullman',
    venue_address: 'Avenue du Colonel Ebeya, Kinshasa',
    venue_details: 'Tenue de soirée exigée',
  },
  memoire: {
    title: 'En mémoire de Papa André',
    message: 'Nous nous réunissons pour honorer sa vie et partager nos souvenirs.',
    venue_name: 'Salle des Cèdres',
    venue_address: 'Avenue de la Montagne, Kinshasa',
    venue_details: 'Un moment de recueillement',
  },
}

/** Representative draft used for gallery previews. */
export function sampleDraft(templateKey: string): InvitationDraft {
  return emptyDraft({
    event_date: '2026-12-12',
    event_time: '15:00',
    emphasis: [],
    ...SAMPLES[templateKey],
  })
}
