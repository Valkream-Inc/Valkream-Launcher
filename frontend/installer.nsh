!macro customInstall
  DetailPrint "Installation de MonLauncher..."
  ; Le dossier data est déjà copié par Electron-builder
!macroend

!macro customUnInstall
  DetailPrint "Désinstallation de MonLauncher..."

  ; Supprimer le dossier data (mods, settings…)
  IfFileExists "$INSTDIR\data\*" 0 end_remove_data
    RMDir /r "$INSTDIR\data"
    DetailPrint "Dossier data supprimé : $INSTDIR\data"
  end_remove_data:

  ; Supprimer les raccourcis créés
  Delete "$DESKTOP\MonLauncher.lnk"
  RMDir /r "$SMPROGRAMS\MonLauncher"

  DetailPrint "Désinstallation terminée."
!macroend
