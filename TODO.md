# TODO

## Packages prioritaire a faire dans l'ordre susivant (4 --> 1 --> 3 --> 2)

- 1 : [ ] (?) transformer les different theme en vraie theme mui valide avec le passage à la derniére version
- 2 : [ ] (?) migrer l'application vers TAURI
- 3 : [ ] (?) rajouter un chemin d'installation par défaut/ que l'on demandera de modifier ou non au premier démarrage via un panel "info", et un qelecteur de fichier (l'installeur devra lire un flag avec le chmin pour pouvoir suprimer ce path lors de la déinstallation). Il faudra également gérer le changemment de ROOTPATH via les générals settings.
- 4 : [ ] (?) il faudra revoir la structure de gestion des jeux cf ce prompt : Salut regarde ma repo ValkreamLauncher dans l'organisations Valkream-Inc et fait moi un plan d'actions détaillé pour avoir un system de gestion des jeux plus propre et adaptable ...
  je veux pouvoir crée des nouveaux jeux ou d'autres instances du meme jeux sans code redondant il faudrai donc une config dans le main electron pour chaue instance avec toute les infos frontend et un 1 pr le backend avec toute les infos backend ip id nom, et aussi un system de paramétre via le backend ex: on peut définir une liste de mod ou un url ou un chemin relatif ou en core la mettre en dur dans le code du backend ... il faut que les pattern se basse sur une installation de type base (réinstallation) avec des chemin relatif aux root path l'id ? et des liens vers des zip ou vers la config online etc... puis le pattern pour chaque sous lien qui change avec les update definir un ou plusieurs pattern pour des sous path (ils ne doivent pas posser de probléme entre eux) ex dans /mods/ nexus + thunderstore + d'autre patern etc... il faut que le pattern de type base utilise un system de hash enfin il faut une liste de mod et de contributeur via la config backend ? pour chaque instance pour l'affichage dans l'onglet mods et un onglet debug avec les tableaux associés a chaque pattern pour chaque sub path et un tableau recap qui montre si ca fonctionne ou non... il faut également que le system de beta soit pris en compte dans une installation local séparré

## Pour plus tard

- [ ] (++) optimize performance in TreeJs (3d ..?), optimize performance in react (useMemo, useCallback, etc.)
- [ ] (++) optimize base fonction (trottle, etc.)
- [ ] (++) mettre http2 en place (got plutot que axios)
- [ ] (++) mettre en place les hash lors de l'installation pour ne recommencer que ce qui a foiré.
- [ ] (++) mettre en place la verification des plugins et configs via Hash
- [ ] (+++) mettre a jour la doc
