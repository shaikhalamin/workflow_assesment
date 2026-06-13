FROM node:22-alpine

ENV NODE_ENV=development
ENV PNPM_HOME=/pnpm
ENV COREPACK_HOME=/corepack
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

RUN mkdir -p "$PNPM_HOME" "$COREPACK_HOME" \
  && corepack enable \
  && corepack prepare pnpm@10.15.0 --activate \
  && chmod -R a+rX "$PNPM_HOME" "$COREPACK_HOME"

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8870
CMD ["pnpm", "dev"]