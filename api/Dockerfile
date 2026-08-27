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

# api/src/calculator-client/generated is gitignored (see api/.gitignore /
# root .gitignore) - it's generated from proto/calculator.proto, same as the
# local `npm run generate:proto` setup step in README.md.
RUN npm run generate:calculator-proto

# nest build (tsc) compiles src/ *and* scripts/ into dist/, matching what's
# already on disk locally - see dist/src/main.js, dist/scripts/migrate.js.
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# --ignore-scripts skips the husky "prepare" script (see the deps stage);
# bcrypt's own install script (selects its prebuilt native binding) is
# skipped too, so it's re-run explicitly via `npm rebuild`.
RUN npm ci --omit=dev --ignore-scripts \
  && npm rebuild bcrypt \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
# ClientsModule resolves protoPath relative to process.cwd() at runtime
# (see src/patients/patients.module.ts), so this must ship alongside dist/.
COPY proto ./proto
# tsc doesn't copy non-.ts assets, so the raw migration SQL files never make
# it into dist/scripts on their own (see scripts/migrate.ts: MIGRATIONS_DIR
# is resolved relative to the compiled script's own __dirname).
COPY scripts/migrations ./dist/scripts/migrations
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
