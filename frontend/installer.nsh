!macro customInstall
  DetailPrint "Installation de MonLauncher..."
!macroend

!macro customUnInstall
  DetailPrint "Désinstallation de MonLauncher..."

  ; Supprimer le dossier data (mods, settings…)
  IfFileExists "$INSTDIR\..\valkream-launcher-data\*" 0 end_remove_data
    RMDir /r "$INSTDIR\..\valkream-launcher-data"
    DetailPrint "Dossier data supprimé : $INSTDIR\..\valkream-launcher-data"
  end_remove_data:

  ; Supprimer les raccourcis créés
  Delete "$DESKTOP\MonLauncher.lnk"
  RMDir /r "$SMPROGRAMS\MonLauncher"

  DetailPrint "Désinstallation terminée."
!macroend
