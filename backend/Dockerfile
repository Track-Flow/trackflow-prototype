# base image
FROM node:22.21-slim

# set working directory
WORKDIR /app/

# install app dependencies
COPY package*.json ./

# install dependencies
RUN npm ci --only=production

# copy app source code
COPY . .

# expose port
EXPOSE 3000

# start the app
CMD ["node", "index.js"]