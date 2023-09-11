# Base layer
FROM node:20.5.1-alpine as base
WORKDIR /home/node/app

# Build layer
FROM base as build

COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build

# Production layer
FROM base as production

ENV NODE_ENV=production
COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile --production
COPY --from=build /home/node/app/dist ./dist

CMD ["node", "."]
