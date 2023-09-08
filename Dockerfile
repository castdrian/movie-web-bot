# Base layer
FROM node:20.5.1-alpine as base
WORKDIR /home/node/app

# Build layer (everything besides build output & node_modules can be discarded from this)
FROM base as build

COPY yarn.lock package.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn run build

# Production layer, only copy required files to run.
FROM base as production

ENV NODE_ENV=production
COPY --from=build /home/node/app/package.json ./
COPY --from=build /home/node/app/dist ./dist
RUN yarn install --frozen-lockfile --production

CMD ["node", "."]
