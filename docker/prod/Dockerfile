# This builder is just to build using soirce code
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

# Install exact dependnancy exist in package-lock.json
RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

# Now as builder has build the production ready code we will create production ready image
FROM node:18-alpine as runner

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# 3rd party script install ignore
RUN npm ci --ignore-scripts --legacy-peer-deps

COPY --from=builder /app/dist ./

EXPOSE 5501

CMD ["node", "src/server.js"]