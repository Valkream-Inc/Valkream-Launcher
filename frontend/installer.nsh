; Hooks NSIS du Valkream-Launcher (electron-builder).
;
; MISE À JOUR (installeur lancé par le launcher, paramètre --updated) : RIEN n'est supprimé.
;   Les jeux et les réglages restent en place. Une nouvelle version MAJEURE du launcher nettoie ses
;   installations au premier démarrage (dans l'application : lib/launcher-version.ts), pas ici.
;
; DÉSINSTALLATION COMPLÈTE : le launcher et tout ce qu'il a créé disparaissent :
;   - le dossier de données (jeux par défaut, outils) ;
;   - les dossiers de jeux choisis ailleurs par le joueur, listés par l'application dans
;     uninstall-paths.txt (lib/uninstall-paths.ts). Chaque ligne doit finir par \instances ET contenir
;     le fichier repère .valkream-games : rien d'autre n'est jamais supprimé.
;   Les réglages dans %APPDATA%\Valkream-Launcher sont supprimés ci-dessous (le productName a une espace, donc
;   deleteAppDataOnUninstall d'electron-builder ne vise plus ce dossier).
;
; Dossier de données : $INSTDIR\..\valkream-launcher-data (voir core/dirs.ts).

!macro customInstall
  DetailPrint "Installation de Valkream-Launcher..."
!macroend

!macro customUnInstall
  DetailPrint "Désinstallation de Valkream-Launcher..."
  Push $R0
  Push $R1
  Push $R2
  Push $R3

  StrCpy $R0 "$INSTDIR\..\valkream-launcher-data"

  ; === Mise à jour : on ne touche à rien ===
  ${if} ${isUpdated}
    DetailPrint "Mise à jour détectée : jeux et données conservés."
    Goto valkream_done
  ${endif}
  ; Repli : flag posé par le launcher juste avant d'installer une mise à jour
  IfFileExists "$R0\updater-details.flag" 0 valkream_full
    DetailPrint "Mise à jour détectée (flag) : jeux et données conservés."
    Delete "$R0\updater-details.flag"
    Goto valkream_done

  valkream_full:
  ; === Désinstallation complète : dossiers de jeux personnalisés ===
  IfFileExists "$R0\uninstall-paths.txt" 0 valkream_data
    FileOpen $R1 "$R0\uninstall-paths.txt" r
  valkream_read:
    ClearErrors
    FileRead $R1 $R2
    IfErrors valkream_read_done
  valkream_trim:
    StrCpy $R3 $R2 1 -1
    StrCmp $R3 "$\r" valkream_cut
    StrCmp $R3 "$\n" valkream_cut
    Goto valkream_check
  valkream_cut:
    StrCpy $R2 $R2 -1
    Goto valkream_trim
  valkream_check:
    StrCpy $R3 $R2 10 -10
    StrCmp $R3 "\instances" 0 valkream_read
    IfFileExists "$R2\.valkream-games" 0 valkream_read
      RMDir /r "$R2"
      RMDir "$R2\.."
      DetailPrint "Dossier de jeux supprimé : $R2"
      Goto valkream_read
  valkream_read_done:
    FileClose $R1

  ; === Désinstallation complète : réglages dans %APPDATA% (« Valkream-Launcher », voir core/dirs.ts) ===
  ; deleteAppDataOnUninstall vise le dossier du productName (« Valkream Launcher ») : celui-ci est supprimé ici.
  valkream_data:
  RMDir /r "$APPDATA\Valkream-Launcher"

  ; === Désinstallation complète : dossier de données ===
  IfFileExists "$R0\*" 0 valkream_done
    RMDir /r "$R0"
    DetailPrint "Dossier de données supprimé : $R0"

  valkream_done:
  Pop $R3
  Pop $R2
  Pop $R1
  Pop $R0
  DetailPrint "Désinstallation terminée."
!macroend
