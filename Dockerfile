FROM node:12-alpine

LABEL name "Success Poster"
LABEL version "3.0.0"
LABEL maintainer "Carter Himmel <fyko@sycer.dev>"

WORKDIR /usr/success-poster

COPY package.json pnpm-lock.yaml ./

RUN apk add --update \
&& apk add --no-cache ca-certificates \
&& apk add --no-cache --virtual .build-deps git curl build-base python g++ make \
&& curl -L https://unpkg.com/@pnpm/self-installer | node \
&& pnpm i \
&& apk del .build-deps

COPY . .

EXPOSE 4973

ENV TOKEN= \
	OWNERS= \
	COLOR= \
	API_PORT= \
	MONGO=
RUN pnpm run build

CMD ["node", "."]

