FROM node:20

# Définit d'abord le dossier de travail
WORKDIR /opt/frontend

COPY package.json .
# Puis exécute les commandes dans ce dossier
RUN npm install --legacy-peer-deps

# Copie les fichiers dans le dossier de travail
COPY . .

# Expose le port que tu utiliseras (5173 pour Vite ou http-server)
EXPOSE 8080

# Option A : utiliser un script personnalisé
# Assure-toi que launch.sh est bien copié et exécutable
# RUN chmod +x launch.sh
# CMD ["/opt/frontend/launch.sh"]

CMD ["npm", "run", "dev"]
# Option B : lancer directement http-server (si pas de script nécessaire)
# CMD ["http-server", "dist", "-p", "5173"]
