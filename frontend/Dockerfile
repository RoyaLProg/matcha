FROM node:20

RUN npm install -g http-server

WORKDIR /opt/frontend

COPY package.json .

EXPOSE 5173

CMD /opt/frontend/launch.sh

# CMD [ "http-server", "dist" ]
