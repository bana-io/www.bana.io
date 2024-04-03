---
title: "Google Cloud Build: Deploying to Google Kubernetes Engine"
date: "2018-07-24"
tags: ["blog"]
type: post
permalink: /blog/google-cloud-build-deploying-to-google-kubernetes-engine
---
# Google Cloud Build: Deploying to Google Kubernetes Engine

[Cloud Build](https://cloud.google.com/cloud-build/) has made deploying to [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine/) very easy.

Here are the steps required to deploy a static site compiled with Hugo and served by Caddy with HTTPS to Kubernetes. For debugging purposes we make a file containing the first 7 characters of the commit SHA, this can be accessed at https://bana.io/VERSION, so that we can verify a new version was deployed on Kubernetes. If you're using Google Cloud Platform, this is very simple if you ask me.

## Prerequisites

Follow the [Deploying artifacts](https://cloud.google.com/cloud-build/docs/configuring-builds/build-test-deploy-artifacts#deploying_artifacts) steps so that you can use `kubectl` to deploy to Kubernetes Engine.

## `cloudbuild.yaml`

```yaml
steps:
# Cloud Build isn't handling submodules at the moment, so we manually clone it into the themes directory.
- name: "gcr.io/cloud-builders/git"
  args: ["clone", "--depth", "1", "https://github.com/calintat/minimal.git"]
  dir: "/workspace/themes"
# Store the git sha so that we know what version of the site we are at
- name: "ubuntu"
  args: ["bash", "-c", "echo $SHORT_SHA > VERSION && date --iso-8601=seconds >> VERSION && ls -lah"]
# Double-chek that VERSION was persisted in the workspace
- name: "ubuntu"
  args: ["bash", "-c", "cat VERSION"]
# use Docker Compose to build instead of Docker
- name: "docker/compose:1.15.0"
  args: ["build"]
# push the images just before we update the Kubernetes deployment
- name: "gcr.io/cloud-builders/docker"
  args: ["push", "gcr.io/www.bana.io/www.bana.io:latest"]
# update the deployment
- name: "gcr.io/cloud-builders/kubectl"
  args: ["patch", "deployment", "www.bana.io", "-p", "{\"spec\":{\"template\":{\"metadata\":{\"labels\":{\"SHORT_SHA\":\"$SHORT_SHA\"}}}}}"]
  env:
  - "CLOUDSDK_COMPUTE_ZONE=us-central1-a"
  - "CLOUDSDK_CONTAINER_CLUSTER=www.bana.io-cluster"

images:
- "gcr.io/www.bana.io/www.bana.io"

tags:
- "www.bana.io"
- "frontend"
```

## `docker-compose.yaml`

```yaml
version: "3"
services:
  www.bana.io:
    image: gcr.io/www.bana.io/www.bana.io:latest
    container_name: www.bana.io
    hostname: www.bana.io
    build:
      context: .
      dockerfile: ./Dockerfile
    volumes:
      - caddy-certs:/root/.caddy/
    ports:
      - 80:80
      - 443:443
    labels:
      kompose.service.type: loadbalancer

volumes:
  caddy-certs:
```

## `Caddyfile`

```Caddyfile
bana.io www.bana.io {
  tls bana@bana.io

  log stdout
  errors stderr

  browse
  gzip
}
```

## `Dockerfile`

```Dockerfile
FROM klakegg/hugo:0.45-alpine-onbuild AS hugo

FROM abiosoft/caddy:0.11.0-no-stats
# auto-agree to Let's Encrypt Subscriber Agreement
ENV ACME_AGREE true

COPY ./Caddyfile /etc/Caddyfile
COPY --from=hugo /onbuild /srv
COPY ./VERSION /srv/VERSION

RUN echo -e "\033[92m  ---> ls -lah /srv/ \033[0m"; ls -lah /srv/; true;
RUN echo -e "\033[92m  ---> cat VERSION \033[0m"; cat /srv/VERSION; true;
```

## Build Log

```bash
TODO
```
