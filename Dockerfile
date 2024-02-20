# Use a Node.js base image
FROM node:20-alpine as builder

# Set the working directory in the container
WORKDIR /app

# Copy package management files
COPY package.json yarn.lock ./

# Install all dependencies (including devDependencies for building)
RUN yarn install

# Copy the rest of your application's source code
COPY . .

# Compile TypeScript to JavaScript
RUN yarn build

# Start a new stage from scratch for a smaller final image
FROM node:20-alpine

WORKDIR /app

# Copy package management files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --production

# Copy built JavaScript files and any other necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY . .

# Your application's default command
CMD ["yarn", "start"]
