# use official node.js image as our base
FROM node:22.14.0-slim

# set working directory inside container
WORKDIR /usr/src/app

# copy package.json and package-lock.json first to leverage docker cache
COPY package*.json ./

# install all dependencies
RUN npm install

# Copy the rest of our app's source code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 5501

# The command to run our app
CMD ["npm", "run", "dev"]