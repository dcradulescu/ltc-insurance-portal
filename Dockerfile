FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_PUBLIC_URL=http://localhost:3000
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Chromium is required to render every original HTML page without data loss.
# The browser blocks outbound requests and renders source in memory only.
RUN apk add --no-cache chromium nss freetype harfbuzz ttf-freefont
ENV CANONICAL_REPORT_CHROMIUM_PATH=/usr/bin/chromium
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
# Required at PDF-request time; the immutable hashes are checked again
# before binding and printing client information.
COPY --from=build /app/original-templates ./original-templates
COPY --from=build /app/report-templates ./report-templates
# Leave sandbox enabled by default; deployment must validate container
# sandbox requirements rather than silently weakening isolation.
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
