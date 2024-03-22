FROM node:latest

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]

VOLUME /app/data 
# store joke types persistently in a volume
