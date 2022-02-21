FROM node:12-alpine

LABEL name "Cooking Tools"
LABEL version "1.0.4"
LABEL maintainer "Carter Himmel <fyko@sycer.dev>"

WORKDIR /usr/cooking-tools

COPY package.json yarn.lock .yarnclean ./

RUN apk add --no-cache --virtual build-deps \
      python \
      g++ \
      build-base \
      cairo-dev \
      jpeg-dev \
      pango-dev \
      musl-dev \
      giflib-dev \
      pixman-dev \
      pangomm-dev \
      libjpeg-turbo-dev \
      freetype-dev \
    && yarn install \
    && apk del build-deps \
    && apk add --no-cache \
      cairo \
      jpeg \
      pango \
      musl \
      giflib \
      pixman \
      pangomm \
      libjpeg-turbo \
      freetype


# RUN apk add --update \
# && apk add --no-cache ca-certificates \
# && apk add --no-cache --virtual .build-deps git curl build-base python g++ make cairo-dev libjpeg-turbo-dev pango \
# && apk del .build-deps

# RUN apk add --no-cache --virtual .health-check curl \
# 	&& apk add --no-cache --virtual .build-deps git build-base g++ \
# 	&& apk add --no-cache --virtual .npm-deps cairo-dev libjpeg-turbo-dev pango \
# 	&& yarn install --ignore-engines

COPY . .

ENV TOKEN= \
	COLOR= \
	PREFIX= \
	OWNERS= \
	MONGO= \
	TWITTER_CONSUMER_KEY= \
	TWITTER_CONSUMER_SECRET= \
	TWITTER_ACCESS_TOKEN= \
	TWITTER_ACCESS_TOKEN_SECRET= \
	MEME_KEY=

RUN yarn build
CMD ["node", "."]

