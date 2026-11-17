FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY proto ./proto
COPY src ./src
COPY scripts ./scripts

RUN npm run generate:calculator-proto

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts \
  && npm rebuild bcrypt \
  && npm cache clean --force

COPY --from=build /app/dist ./dist

COPY proto ./proto

COPY scripts/migrations ./dist/scripts/migrations
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV ENV_FILE=.env
RUN touch .env

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
