# Use an official Node.js runtime as a parent image
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port 3001
EXPOSE 3001

# Run the application
CMD [ "node", "src/index.js" ]
