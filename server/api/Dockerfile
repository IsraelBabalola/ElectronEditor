FROM node:18

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3001

RUN chown -R node:node /usr/src/app/storage

USER node

CMD ["npm", "start"]
