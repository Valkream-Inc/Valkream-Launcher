@echo off
REM Aller à la racine du projet
cd ../..

REM Lancer le backend dans une nouvelle fenêtre
cd backend-update-server
start cmd /k yarn run start
cd ..

REM Lancer l'UI de mise à jour dans une nouvelle fenêtre
cd updater-ui
start cmd /k yarn run start-watch
cd ..

REM Retour à la racine
cd ..