# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory to /app/game
WORKDIR /app/game

# Move node modules outside the app folder
ENV NODE_PATH /node_modules
ENV PATH $PATH:/node_modules/.bin

# Copy the package.json and package-lock.json files into the container
COPY ./package*.json .

# Install app dependencies
RUN npm ci --prefer-offline

# Copy the rest of the application code into the container
COPY . .
