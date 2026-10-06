/**
 * Template registry: key → renderer + catalog metadata.
 *
 * Keys must match the backend catalog seeded by
 * `templates_app/migrations/0002_seed_templates.py`. Rendering is pure
 * front-end code; template `config` from the API is never executed.
 */
import { Confetti } from './Confetti.tsx'
import { HeritageLuxe } from './HeritageLuxe.tsx'
import { JardinFloral } from './JardinFloral.tsx'
import { LigneModerne } from './LigneModerne.tsx'
import { Memoire } from './Memoire.tsx'
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
    emphasis: [],
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
