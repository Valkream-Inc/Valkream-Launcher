# Utilise une image Node.js officielle légère
FROM node:22-alpine

# Dossier de travail
WORKDIR /app

# Copie les fichiers de dépendances
COPY package.json yarn.lock ./

# Installe les dépendances (production uniquement)
RUN yarn install --production

# Copie le reste du code, sauf .env
COPY . .
# Supprime le .env s'il a été copié accidentellement (sécurité)
RUN rm -f .env || true

# Expose le port (par défaut 3000, mais peut être surchargé par la variable d'environnement)
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT

# Commande de lancement
CMD ["node", "server.js"] 