FROM alpine:latest

LABEL author="Fabian Hintringer" \
      name="reminder-bot" \
      version="1.0.0"

# Install dependencies, Node.js, and Yarn
RUN apk add --no-cache curl bash nodejs npm && npm install -g yarn

# Set work directory and copy application code
WORKDIR /app
COPY . .

# Install Node.js dependencies
RUN yarn install

# If you have an entrypoint script, ensure it's executable
# Uncomment the next line if your entrypoint script is used
# RUN chmod +x ./entrypoint.sh

# Start the application
CMD ["yarn", "dev"]
