!macro customInstall
  DetailPrint "Installation de MonLauncher..."
  ; Ici on ne touche pas au dossier data, electron-builder l’a déjà copié
!macroend


!macro customUnInstall
  DetailPrint "Désinstallation de MonLauncher..."

  ; Récupère le dossier d’installation
  Var /GLOBAL installPath
  StrCpy $installPath "$INSTDIR"

  ; Supprime ton dossier data (mods, settings…)
  RMDir /r "$installPath\\data"
  DetailPrint "Dossier data supprimé : $installPath\\data"

  ; Supprime aussi raccourcis, etc.
  Delete "$DESKTOP\\MonLauncher.lnk"
  Delete "$SMPROGRAMS\\MonLauncher\\*.*"
  RMDir "$SMPROGRAMS\\MonLauncher"

  DetailPrint "Désinstallation terminée."
!macroend
