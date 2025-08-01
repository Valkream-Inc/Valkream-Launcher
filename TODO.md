# TODO

## Frontend

- [ ] (---) mettre valkream team partout
- [ ] (-) mettre logger partout
- [ ] ( ) corrige les erreurs d'obfuscation
- [ ] ( ) mettre en place l'option de doc (en beta)
- [ ] (+) mettre en place l'installation steam
- [ ] (++) mettre en place la verification des plugins et configs via Hash
- [ ] (+++) corriger les paths dans le gameManager (

  const securedGameFolderToRemove = gameFolderToRemove.filter((folder) => {
  const fullPath = path.resolve(this.gameDir, folder); // Chemin absolu final

  // Vérifie que le chemin reste bien dans le dossier de base
  if (!fullPath.startsWith(basePath)) return false;

  // Vérifie qu'il est dans un sous-dossier autorisé
  const relative = path.relative(this.gameDir, fullPath);
  return (
  relative.startsWith("BepInEx/cache") ||
  relative.startsWith("BepInEx/plugins/") ||
  relative.startsWith("BepInEx/config/")
  );
  });
  )

## Backend

- [ ] Ajouter la supression des anciennes versions

## Both
