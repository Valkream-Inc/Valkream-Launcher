/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// Exporte la configuration de Vite
export default defineConfig({
  // Définit le chemin de base de l'application. Le './' est essentiel
  // pour le routage de React Router et pour résoudre les assets.
  base: "./",

  // Définit le répertoire racine du projet. Vite cherchera le fichier
  // index.html et d'autres fichiers de configuration dans ce répertoire.
  // Ce doit être le dossier parent qui contient à la fois le code source (p. ex., 'src')
  // et le dossier public.
  root: path.resolve(__dirname, "renderer"),

  // Définit le répertoire public pour les assets statiques qui ne
  // seront pas traités par le bundler, comme les images et les polices.
  // Il est important que ce chemin soit relatif au 'root' défini ci-dessus.
  publicDir: path.resolve(__dirname, "renderer/public"),

  // Les plugins à utiliser, ici React pour gérer le JSX.
  plugins: [react()],

  // Options de build pour la production.
  build: {
    // Spécifie le répertoire de sortie pour la production.
    outDir: path.resolve(__dirname, "renderer/build"),
    // Vide le répertoire de sortie avant chaque construction.
    emptyOutDir: true,
    // Configuration de Rollup pour les dépendances externes.
    rollupOptions: {
      external: ["electron"], // Indique à Rollup de ne pas inclure 'electron' dans le bundle
    },
  },

  // Options du serveur de développement.
  server: {
    port: 8080,
    open: false,
    strictPort: true,
    host: true, // Permet d'accéder au serveur depuis le réseau local.
    // Permet d'accéder aux fichiers en dehors du répertoire 'root'.
    fs: {
      allow: [path.resolve(__dirname, "renderer")],
    },
    // Redirige toutes les requêtes de routage (404) vers index.html,
    // ce qui est nécessaire pour React Router.
    historyApiFallback: true,
  },

  optimizeDeps: {
    // Inclut les dépendances de React dans le bundle.
    include: ["react", "react-dom"],
    exclude: ["electron", "fs"],
  },

  // Configuration des alias pour simplifier les importations.
  resolve: {
    alias: {
      // "@" pointe vers le répertoire racine de votre application.
      "@": path.resolve(__dirname, "renderer"),
    },
  },
});
