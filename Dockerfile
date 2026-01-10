FROM    node:20-alpine as build-stage

WORKDIR /build
COPY    . .

RUN     npm ci
RUN     npm run build

FROM    node:20-alpine as production-stage

RUN     apk update \
        && apk add ca-certificates  \
        && adduser -D -h /home/container container

COPY    --from=build-stage /build/dist /home/container

USER    container
ENV     USER=container HOME=/home/container
WORKDIR /home/container

CMD     [ "node", "index.js" ]