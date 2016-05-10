FROM node:4

# Install cups

RUN apt-get update -qq && \
    apt-get install -qq -y cups && \
    apt-get clean -qq && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /usr/src/app

COPY package.json .npmrc ./

RUN npm install -q

COPY . ./
RUN  mv cupsd.conf /etc/cups/cupsd.conf

ENV CONFIG_FILE /config/config.json

EXPOSE 631

CMD service cups start && node main
