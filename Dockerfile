FROM node:20

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

# Install all dependencies (including dev dependencies)
RUN npm install

COPY . .

# Run the build command
RUN npm run build

CMD ["npm", "start"]
