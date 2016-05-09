FROM node:4

# Install cups
RUN apt-get update
RUN apt-get install -y cups nano wget curl

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN npm install -q

COPY . ./
COPY cupsd.conf /etc/cups/cupsd.conf

### ENV CONFIG_FILE /config/config.json

EXPOSE 631

CMD service cups start && node main
