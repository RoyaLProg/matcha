FROM node:20

WORKDIR /opt/frontend

COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
