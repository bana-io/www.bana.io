---
title: "Google Cloud Build Hello World"
date: "2018-07-21"
tags: ["blog"]
type: post
permalink: /blog/google-cloud-build-hello-world
---
# Google Cloud Build Hello World
<!-- [Cloud Build](https://cloud.google.com/cloud-build/) examples. The source code can be found at [`google-cloud-build-hello-world_examples`](/examples/google-cloud-build-hello-world_examples/), run `make` from within that directory to validate and run the build configuration files. -->

## Prerequisites

Follow the steps [Building and Debugging Locally](https://cloud.google.com/cloud-build/docs/build-debug-locally) so that you can test your `cloudbuild.yaml` without pushing.

## Basic

`cloudbuild_example_1.yaml`:

```yaml
steps:
- name: "ubuntu"
  args: ["bash", "-c", "echo hello world"]
```

Validate `cloudbuild_example_1.yaml` (dry run):

```bash
$ cloud-build-local --config=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/cloudbuild_example_1.yaml --dryrun=true /Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world
2018/07/25 20:48:44 RUNNER - [docker ps -a -q --filter name=step_[0-9]+|cloudbuild_|metadata]
2018/07/25 20:48:44 RUNNER - [docker network ls -q --filter name=cloudbuild]
2018/07/25 20:48:44 RUNNER - [docker volume ls -q --filter name=homevol|cloudbuild_]
2018/07/25 20:48:46 Build id = localbuild_d71472f3-782c-4d08-b475-ef88072063b0
2018/07/25 20:48:46 RUNNER - [docker volume create --name homevol]
2018/07/25 20:48:46 status changed to "BUILD"
BUILD
2018/07/25 20:48:46 RUNNER - [docker inspect ubuntu]
: Already have image: ubuntu
2018/07/25 20:48:46 RUNNER - [docker run --name step_0 --volume /var/run/docker.sock:/var/run/docker.sock --volume cloudbuild_vol_40c0e11a-cc49-4803-8ab3-397838ec62ae:/workspace --workdir /workspace --volume homevol:/builder/home --env HOME=/builder/home --network cloudbuild --privileged ubuntu bash -c echo hello world]
2018/07/25 20:48:46 RUNNER - [docker rm -f step_0]
2018/07/25 20:48:46 status changed to "DONE"
DONE
2018/07/25 20:48:46 RUNNER - [docker volume rm homevol]
2018/07/25 20:48:46 Warning: this was a dry run; add --dryrun=false if you want to run the build locally.
```

Run build:

```bash
$ cloud-build-local --config=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/cloudbuild_example_1.yaml --dryrun=false --write-workspace=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/workspace /Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world
2018/07/25 20:50:52 Warning: The server docker version installed (18.06.0-ce-rc3) is different from the one used in GCB (17.12.0-ce)
2018/07/25 20:50:52 Warning: The client docker version installed (18.06.0-ce-rc3) is different from the one used in GCB (17.12.0-ce)
Using default tag: latest
latest: Pulling from cloud-builders/metadata
Digest: sha256:33726497b103136c2bbb8cd32ef88d6833a70a912f3a6521f9ca8c47f498d2cc
Status: Image is up to date for gcr.io/cloud-builders/metadata:latest
2018/07/25 20:50:58 Started spoofed metadata server
2018/07/25 20:50:58 Build id = localbuild_3714fd08-0c47-48a0-be4b-ae20fe7dd569
2018/07/25 20:50:59 status changed to "BUILD"
BUILD
: Already have image (with digest): ubuntu
: hello world
2018/07/25 20:51:00 status changed to "DONE"
DONE
```

## Failure

Let's check what happens in the event of a failure.

`cloudbuild_example_2.yaml`:

```yaml
steps:
- name: "ubuntu"
  args: ["bash", "-c", "false"]

```

Validate `cloudbuild_example_2.yaml` (dry run):

```bash
$ cloud-build-local --config=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/cloudbuild_example_2.yaml --dryrun=true /Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world
2018/07/25 20:53:56 RUNNER - [docker ps -a -q --filter name=step_[0-9]+|cloudbuild_|metadata]
2018/07/25 20:53:56 RUNNER - [docker network ls -q --filter name=cloudbuild]
2018/07/25 20:53:56 RUNNER - [docker volume ls -q --filter name=homevol|cloudbuild_]
2018/07/25 20:53:57 Build id = localbuild_95031ecd-cb49-4dec-9ae0-f1fb1bbb2054
2018/07/25 20:53:57 RUNNER - [docker volume create --name homevol]
2018/07/25 20:53:57 status changed to "BUILD"
BUILD
2018/07/25 20:53:57 RUNNER - [docker inspect ubuntu]
: Already have image: ubuntu
2018/07/25 20:53:57 RUNNER - [docker run --name step_0 --volume /var/run/docker.sock:/var/run/docker.sock --volume cloudbuild_vol_ef16d16b-03bd-4c8d-b9fc-6f013ac66907:/workspace --workdir /workspace --volume homevol:/builder/home --env HOME=/builder/home --network cloudbuild --privileged ubuntu bash -c false]
2018/07/25 20:53:57 RUNNER - [docker rm -f step_0]
2018/07/25 20:53:57 status changed to "DONE"
DONE
2018/07/25 20:53:57 RUNNER - [docker volume rm homevol]
2018/07/25 20:53:57 Warning: this was a dry run; add --dryrun=false if you want to run the build locally.
```

Run build:

```bash
$ cloud-build-local --config=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/cloudbuild_example_2.yaml --dryrun=false --write-workspace=/Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world/workspace /Users/mbana/home/mbana/dev/bana-io/gcloud/www.bana.io/content/blog/cloud-build-hello-world
2018/07/25 20:54:28 Warning: The server docker version installed (18.06.0-ce-rc3) is different from the one used in GCB (17.12.0-ce)
2018/07/25 20:54:28 Warning: The client docker version installed (18.06.0-ce-rc3) is different from the one used in GCB (17.12.0-ce)
Using default tag: latest
latest: Pulling from cloud-builders/metadata
Digest: sha256:33726497b103136c2bbb8cd32ef88d6833a70a912f3a6521f9ca8c47f498d2cc
Status: Image is up to date for gcr.io/cloud-builders/metadata:latest
2018/07/25 20:54:35 Started spoofed metadata server
2018/07/25 20:54:35 Build id = localbuild_1f371adf-2a98-4013-b228-e8ce80ca52a1
2018/07/25 20:54:35 status changed to "BUILD"
BUILD
: Already have image (with digest): ubuntu
2018/07/25 20:54:36 status changed to "ERROR"
ERROR
ERROR: build step 0 "ubuntu" failed: exit status 1
2018/07/25 20:54:38 Build finished with ERROR status
```
