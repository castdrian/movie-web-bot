# Base layer
FROM node:20.5.1-alpine as base
WORKDIR /home/node/app
RUN npm i -g pnpm

# Build layer
FROM base as build

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production layer
FROM base as production

EXPOSE 8080
ENV NODE_ENV=production
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /home/node/app/dist ./dist

CMD ["node", "."]
