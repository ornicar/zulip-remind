#!/bin/bash

cd /var/reminder-bot

# There are optional environment variables (REDIS_PORT, REDIS_DB, REDIS_PASSWORD, REDIS_HOST)
# If you want to use them have a look here https://github.com/ornicar/zulip-remind#redis-configuration
# You can execute the optional environment variables if you put them before the command, like:
# REDIS_PORT=1234 REDIS_PASSWORD=SECUREPASSWORD /root/.nvm/versions/node/v14.4.0/bin/yarn dev 
REDIS_HOST=$1 REDIS_PORT=$2 REDIS_PASSWORD=$3 /root/.nvm/versions/node/v14.4.0/bin/yarn dev 
