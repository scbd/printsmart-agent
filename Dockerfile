FROM node:6.9.1

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
RUN  mv docker-entrypoint.sh /

ENV CONFIG_FILE /config/config.json

EXPOSE 631

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["node", "main"]
