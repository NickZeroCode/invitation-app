/**
 * French copy catalog (fr-FR, DRC market).
 *
 * All user-facing strings live here so the architecture is ready for future
 * localization without touching component markup.
 */
export const fr = {
  appName: 'NickEvents',
  common: {
    loading: 'Chargement…',
    retry: 'Réessayer',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    refresh: 'Actualiser',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    collapseSidebar: 'Réduire le menu',
    expandSidebar: 'Développer le menu',
    logout: 'Se déconnecter',
    requiredField: 'Ce champ est obligatoire.',
    invalidEmail: 'Saisissez une adresse e-mail valide.',
    unexpectedError: 'Une erreur est survenue. Veuillez réessayer.',
  },
  nav: {
    overview: "Vue d'ensemble",
    settings: 'Paramètres',
    workspace: 'Espace organisateur',
  },
  login: {
    title: 'Connexion',
    subtitle: 'Accédez à votre espace organisateur.',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion en cours…',
    heroTitle: 'Des invitations élégantes, pour des moments inoubliables.',
    heroText:
      "NickEvents vous accompagne de la création de l'invitation jusqu'à l'accueil de vos invités.",
    heroPoint1: 'Modèles raffinés pour chaque occasion',
    heroPoint2: 'Liens uniques et vérification par QR code',
    heroPoint3: 'Préférences et réponses des invités en un seul endroit',
  },
  overview: {
    title: "Vue d'ensemble",
    subtitle: "L'activité de votre espace organisateur en un coup d'œil.",
    lastUpdated: 'Dernière mise à jour',
    events: {
      title: 'Événements',
      total: 'Événements créés',
      upcoming: 'Événements à venir',
    },
    invitations: {
      title: 'Invitations',
      total: 'Invitations émises',
      active: 'Actives',
      expired: 'Expirées',
      revoked: 'Révoquées',
    },
    responses: {
      title: 'Réponses des invités',
      total: 'Réponses reçues',
      hint: 'Les préférences soumises par vos invités apparaîtront ici.',
    },
    empty: {
      title: 'Aucun événement pour le moment',
      description:
        "La création d'événements et d'invitations sera disponible dans la prochaine étape de l'application.",
    },
    error: {
      title: 'Impossible de charger les statistiques',
      description: 'Les données du tableau de bord sont momentanément indisponibles.',
    },
  },
  settings: {
    title: 'Paramètres',
    subtitle: 'Gérez votre profil et la sécurité de votre compte.',
    profile: {
      title: 'Mon profil',
      description: 'Ces informations identifient votre compte organisateur.',
      firstName: 'Prénom',
      lastName: 'Nom',
      timezone: 'Fuseau horaire',
      timezoneHint: 'Utilisé pour afficher les dates de vos événements.',
      submit: 'Enregistrer le profil',
      success: 'Profil mis à jour.',
    },
    password: {
      title: 'Mot de passe',
      description: 'Choisissez un mot de passe unique et difficile à deviner.',
      current: 'Mot de passe actuel',
      new: 'Nouveau mot de passe',
      confirm: 'Confirmer le nouveau mot de passe',
      submit: 'Modifier le mot de passe',
      success: 'Mot de passe modifié.',
      mismatch: 'Les mots de passe ne correspondent pas.',
    },
  },
  notFound: {
    title: 'Page introuvable',
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    action: "Retour à l'accueil",
  },
} as const
