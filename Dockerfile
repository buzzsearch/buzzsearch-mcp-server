FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install && npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json tools.json ./
ENTRYPOINT ["node", "dist/index.js"]
