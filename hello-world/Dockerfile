FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /data && chown node:node /data

ENV DB_PATH=/data/app.db

EXPOSE 3000

CMD ["node", "index.js"]