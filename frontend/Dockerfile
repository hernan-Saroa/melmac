FROM node:14.21.3-buster

# Instalamos C++ y utilidades para que "canvas" compile nativamente
RUN echo "deb http://archive.debian.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    apt-get update -o Acquire::Check-Valid-Until=false && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

WORKDIR /app

COPY package*.json ./
# Forzamos dependencias legacy compatibles con la version real (Angular 12/14)
RUN npm install --legacy-peer-deps

COPY . .

# Exponemos port 4200 para Angular
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
