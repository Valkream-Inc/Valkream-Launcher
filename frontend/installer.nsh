!macro customInstall
  DetailPrint "Installation de MonLauncher..."
!macroend

!macro customUnInstall
  DetailPrint "Désinstallation de MonLauncher..."

  ; === Vérifier s'il s'agit d'une mise à jour ===
  StrCpy $0 "$INSTDIR\..\valkream-launcher-data\updater-details.flag"
  IfFileExists "$0" 0 not_update
    DetailPrint "⚠️ Mise à jour détectée : le dossier data ne sera pas supprimé."
    Delete "$0" ; Supprimer le flag après utilisation
    Goto skip_data_removal

  not_update:

  ; === Supprimer le dossier data uniquement si pas en update ===
  IfFileExists "$INSTDIR\..\valkream-launcher-data\*" 0 skip_data_removal
    RMDir /r "$INSTDIR\..\valkream-launcher-data"
    DetailPrint "✅ Dossier data supprimé : $INSTDIR\..\valkream-launcher-data"

  skip_data_removal:

  ; === Supprimer les raccourcis créés ===
  Delete "$DESKTOP\MonLauncher.lnk"
  RMDir /r "$SMPROGRAMS\MonLauncher"

  DetailPrint "✅ Désinstallation terminée."
!macroend
