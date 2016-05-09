FROM node:4

# Install cups
RUN apt-get update
RUN apt-get install -y cups nano wget curl
RUN curl http://www.openprinting.org/ppd-o-matic.php\?driver=Postscript\&printer=Generic-PostScript_Printer > /usr/share/ppd/cupsfilters/Generic-PostScript_Printer.ppd

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN npm install -q

COPY . ./
COPY cupsd.conf /etc/cups/cupsd.conf

### ENV CONFIG_FILE /config/config.json

EXPOSE 631

CMD service cups start && node main
