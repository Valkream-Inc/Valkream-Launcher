/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Textes de l'interface en français (langue de référence : en.ts doit avoir les mêmes clés,
 * vérifié par i18n.test.ts). Variables : {{nom}}.
 */

export interface Messages {
  [key: string]: string | Messages;
}

const fr: Messages = {
  common: {
    close: "Fermer",
    cancel: "Annuler",
    change: "Changer",
    loading: "Chargement…",
    continue: "Continuer",
  },
  language: {
    label: "Langue",
    text: "Langue de l'interface du launcher.",
    changed: "Langue changée !",
    fr: "Français",
    en: "English",
  },
  updater: {
    searching: "⏳ Recherche de mise à jour...",
  },
  nav: {
    title: "Paramètres",
    save: "Sauvegarder",
  },
  panel: {
    error: {
      title: "Erreur Critique",
      text: "Un problème grave est survenu. Vous devez redémarrer votre launcher. Si le problème persiste, veuillez contacter l'équipe d'administration !",
    },
    warning: {
      title: "Attention",
      text: "Une mise à jour importante est disponible. Souhaitez-vous la télécharger ?",
    },
    info: {
      title: "Information",
      text: "Le serveur est actuellement en ligne et opérationnel. Veuillez vous connecter pour jouer.",
    },
  },
  admin: {
    on: "Options Admin activées !",
    off: "Options Admin désactivées !",
    cancelBack: "Annuler et revenir",
    confirm:
      "Vous êtes sur le point d'activer des options avancées pouvant endommager votre installation (Admin Tools, Debug Tools, Dev Tools, Fonctionnalités Alpha). Êtes-vous sûr de vouloir continuer ?",
  },
  beta: {
    panel: "Vous avez les tests betas activés ...",
    disable: "Les désactiver",
    on: "Tests beta activés !",
    off: "Tests beta désactivés !",
    text: "Activer les tests beta (récupère les mises à jour beta des jeux). Pour contourner la mise à jour du launcher : Ctrl + Maj + clic sur la vidéo de démarrage.",
    label: "Activer les tests Betas",
  },
  settings: {
    music: {
      on: "Musique activée !",
      off: "Musique désactivée !",
      text: "La musique vous gêne ? Désactivez-la ici.",
      label: "Activer la musique de la vidéo",
    },
    dev: {
      on: "Outils de développement activés !",
      off: "Outils de développement désactivés !",
      text: "Besoin d'activer les outils de développement ? Faites-le ici.",
      label: "Activer les outils de développement",
    },
    debug: {
      text: "Vous pouvez ouvrir le debug (⚠️ : à faire uniquement dans un but de debug et avec des personnes qualifiées :) )",
      button: "Ouvrir le debug",
    },
    appdata: {
      text: "Vous pouvez ouvrir le dossier AppData de Valkream.",
      opened: "AppData ouvert !",
      notOpened: "AppData non ouvert !",
      button: "Ouvrir le dossier AppData",
    },
    theme: {
      changed: "Vous avez changé le thème du launcher !",
      text: "Vous voulez changer le thème du launcher ? Faites-le ici.",
    },
    background: {
      changed: "Vous avez changé le fond d'écran du launcher !",
      text: "Vous voulez changer le fond d'écran du launcher ? C'est ici !",
      video: "Vidéo",
      image: "Image",
      threeD: "3D (PC performant nécessaire)",
    },
    uninstallLauncher: {
      done: "Launcher désinstallé !",
      failed: "Launcher non désinstallé !",
      text: "Vous voulez désinstaller le launcher et les jeux ? Faites-le ici. Mais attention, vous perdrez tous les paramètres de jeux, mais vous conserverez vos personnages.",
      button: "Désinstaller",
    },
    gamesRoot: {
      text: "Dossier d'installation des jeux. Changer le dossier déplace les jeux déjà installés (peut durer plusieurs minutes sur un autre disque).",
      change: "Changer",
      moving: "Déplacement…",
      reset: "Dossier par défaut",
      moved: "Jeux déplacés vers {{folder}}",
    },
  },
  instance: {
    noConfig: "Instance « {{id}} » sans config render.",
    dangerZone: "⚠️ Danger zone !",
    advanced: "⚠️ Advanced !",
    noMods: "Aucun mod à afficher pour cette instance.",
    steam: {
      on: "Steam sera démarré avant le jeu.",
      off: "Steam ne sera plus démarré par le launcher.",
      text: "Démarrer Steam avant le jeu (nécessaire à la vérification de possession du jeu) ?",
      label: "Lancer Steam avec le jeu",
    },
    saveFailed: "Réglage non enregistré !",
    openGame: {
      text: "Vous pouvez ouvrir le dossier du jeu de Valkream.",
      opened: "Dossier du jeu ouvert !",
      notOpened: "Dossier du jeu non ouvert !",
      button: "Ouvrir le dossier du jeu",
    },
    uninstall: {
      done: "Jeu désinstallé !",
      failed: "Jeu non désinstallé !",
      text: "Vous pouvez supprimer les fichiers de jeux Valkream.",
      button: "Désinstaller le jeu",
    },
    behavior: {
      saved: "Comportement du launcher sauvegardé !",
      text: "Comportement du launcher au lancement du jeu :",
      hide: "Masquer le launcher",
      close: "Fermer le launcher",
      nothing: "Ne rien faire",
    },
  },
  home: {
    tips: "Astuces du jour",
    event: "Évènement",
    moreDetails: "Voir plus de détails",
    maintenance: "Maintenance",
    loading: "🟠 Chargement ...",
    inMaintenance: "🔵 En Maintenance",
    online: "🟢 En ligne",
    offline: "🔴 Hors ligne",
  },
  games: {
    search: "Rechercher un jeu...",
    searchLabel: "Rechercher",
    none: "Aucun jeu trouvé pour « {{search}} »",
  },
  button: {
    welcome: "Bienvenue sur le launcher de Valkream ! 👋",
    cancelled: "Installation annulée",
    install: "Installer",
    reinstall: "Réinstaller\n (⚠️ Nouvelle version majeure.)",
    update: "Mettre à jour",
    play: "Jouer",
    playVersion: "Jouer à la v{{version}}",
    maintenance: "\n (⚠️ Maintenance en cours.)",
    dangerActive: "\n (⚠️ {{label}} activés.)",
    cannotInstall: "Installation Impossible\n (❌ Pas de connexion {{what}}.)",
    playOffline: "{{play}}\n (⚠️ Pas de connexion {{what}}.)",
    incomplete: "Installation incomplète\n (❌ Connexion requise.)",
    toServer: "au serveur",
    toInternet: "à internet",
    unknown: "Erreur inconnue, contactez le support.",
    checkError: "Erreur lors de la vérification",
    checkErrorToast: "Erreur lors de la vérification de la version !",
    launchError: "Erreur lors du lancement du jeu !",
    installing: "l'installation",
    updating: "la mise à jour",
    installDone: "Installation terminée !",
    updateDone: "Mise à jour terminée !",
    errorDuring: "Erreur lors de {{action}} !",
    speed: "{{percent}}% ({{done}}{{total}}) à {{speed}}/s",
  },
  steam: {
    dialogTitle: "Le jeu n'est pas utilisable tel quel",
    pick: "Localiser l'installation",
    depot: "Télécharger la bonne version (QR)",
    cancelDepot: "Annuler le téléchargement",
    retry: "J'ai installé la bonne version : réessayer",
    scan: "Scannez le QR code avec l'application mobile Steam (Steam Guard → « Scanner un code QR »). Le launcher ne voit pas votre mot de passe.",
    infoTitle: "À savoir avant d'utiliser DepotDownloader",
    infoContinue: "J'ai compris, continuer",
    info: {
      what: "**DepotDownloader** est un outil open source (licence GPL-2.0) qui télécharge une version précise d'un jeu depuis les serveurs de Steam.",
      source: "Code source : {{url}}",
      title: "Ce qui se passe",
      step1: "1. Le launcher télécharge la version officielle **{{version}}** de l'outil, vérifie son empreinte sha256 puis le range dans `{{dir}}`. S'il est modifié, il est refusé.",
      step2: "2. Une fenêtre affiche un **QR code** : scannez-le avec l'application mobile Steam. Votre mot de passe et votre code Steam Guard ne passent jamais par le launcher.",
      step3: "3. Le jeu est téléchargé dans `{{dir}}`, puis chaque fichier est vérifié avant d'être copié dans l'instance. Ce dossier est ensuite supprimé.",
      step4: "4. Le jeu doit appartenir à votre compte Steam. Ne partagez jamais les fichiers téléchargés.",
      cancel: "Vous pouvez annuler à tout moment.",
      notConfigured: "non configurée",
    },
  },
};

export default fr;
