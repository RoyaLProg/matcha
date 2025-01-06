FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm run dev

EXPOSE 3000


# CMD ["node", "dist/main"]
