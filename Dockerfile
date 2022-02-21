FROM node:12-alpine

LABEL name "Sycer Development Carts Distribution"
LABEL version "0.1.0"
LABEL maintainer "Carter Himmel <me@fyko.net>"

WORKDIR /usr/carts

COPY package.json pnpm-lock.yaml ./

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm i \
&& apk del .build-deps

COPY . .

RUN pnpm run build
CMD ["node", "."]

