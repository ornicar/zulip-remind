FROM debian:buster-slim

LABEL author="Fabian Hintringer" \
    name="reminder-bot" \
    version=1.0.0

ARG REDIS_PORT \
     REDIS_HOST \
     REDIS_PASSWORD

ENV REDIS_HOST=$REDIS_HOST \
    REDIS_PORT=$REDIS_PORT \
    REDIS_PASSWORD=${REDIS_PASSWORD}

RUN mkdir -p /var/reminder-bot

COPY ./ /var/reminder-bot/

RUN cd /var/reminder-bot \
    && apt-get update \
    && apt-get upgrade -y \
    && apt-get install curl unzip -y \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash \
    && export NVM_DIR="$HOME/.nvm" \
    && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" \
    && [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" \
    && nvm install 14.4.0 -y\
    && apt-get update \
    && apt-get install npm -y\
    && npm install -g npm@7.20.0 \
    && npm install --global yarn --no-optionals -y \  
    && yarn install \
    && chmod +x /var/reminder-bot/entrypoint.sh 

ENTRYPOINT /var/reminder-bot/entrypoint.sh ${REDIS_HOST} ${REDIS_PORT} ${REDIS_PASSWORD}
