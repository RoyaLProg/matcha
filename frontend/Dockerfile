FROM node:20

RUN npm install -g http-server

WORKDIR /app

RUN npm install

RUN npm run dev

EXPOSE 8080
# CMD [ "http-server", "dist" ]