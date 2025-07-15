FROM node:lts-buster

RUN apt-get update && \
  apt-get install -y \
  chromium \
  libatk-bridge2.0-0 \
  libxkbcommon0 \
  libwayland-client0 \
  libgtk-3-0 && \
  rm -rf /var/lib/apt/lists/*

#RUN apt-get install -yq tzdata

#ENV TZ="America/Guayaquil"

COPY package*.json .

RUN npm install cors

RUN npm install

RUN npm install github:pedroslopez/whatsapp-web.js
#RUN npm install whatsapp-web.js
#RUN npm install qrcode-terminal

COPY . .

COPY LocalWebCache.js /node_modules/whatsapp-web.js/src/webCache/LocalWebCache.js

#RUN npm update whatsapp-web.js

#RUN cd /node_modules/whatsapp-web.js/ && npm install puppeteer@latest

#RUN npm install cors

EXPOSE 5000

CMD ["npm", "start"]
