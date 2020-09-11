FROM node:12-alpine as build-stage

RUN apk update && \
    apk upgrade && \
    apk add git

WORKDIR /app

COPY package*.json /app/
COPY yarn.lock /app/

RUN yarn install

COPY ./ /app/

RUN yarn build
