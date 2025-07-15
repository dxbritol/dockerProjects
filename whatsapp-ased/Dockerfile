# Usa Node slim como base
FROM node:20-slim

# Crea carpeta de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Evita que puppeteer descargue Chromium (porque lo instalaremos manualmente)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Instala puppeteer y dependencias del proyecto
RUN npm uninstall puppeteer-core || true && \
    npm install puppeteer && \
    npm install
RUN npm install cors

# Instala Chromium manualmente para ARM64
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copia el resto de los archivos de la app
COPY . .

# Sobrescribe el archivo modificado de whatsapp-web.js
COPY LocalWebCache.js /app/node_modules/whatsapp-web.js/src/webCache/LocalWebCache.js

# Expón el puerto
EXPOSE 5000

# Comando por defecto
CMD ["npm", "start"]
