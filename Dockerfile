# syntax=docker/dockerfile:1.0.0-experimental
# Stage 0, "build-stage" to build and compile the frontend
FROM node:14.15.0-alpine as build-stage

RUN apk update && \
    apk upgrade && \
    apk add git && \
    apk add openssh-client

WORKDIR /app

COPY package*.json /app/
COPY yarn.lock /app/

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# RUN yarn install
RUN --mount=type=ssh,id=github yarn install

COPY ./ /app/

RUN yarn build

CMD [ "yarn", "start" ]