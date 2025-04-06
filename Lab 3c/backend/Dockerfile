# Use the official Node.js 20 image as the base image
FROM --platform=linux/arm64 node:20-alpine

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Run the web service on container startup.
CMD [ "node", "app.js" ]
