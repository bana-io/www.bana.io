---
title: "CircleCI: Authorizing the Google Cloud SDK"
date: "2018-08-02"
tags: ["blog"]
type: post
permalink: /blog/circleci-authorizing-the-google-cloud-sdk
---
# CircleCI: Authorizing the Google Cloud SDK

<!-- The source code can be found at [`circleci-authorizing-the-google-cloud-sdk_examples`](/examples/circleci-authorizing-the-google-cloud-sdk_examples/). -->

## Prerequisites

* Follow the steps outlined here [Authorizing Cloud SDK tools: Authorizing with a service account](https://cloud.google.com/sdk/docs/authorizing#authorizing_with_a_service_account). You should have downloaded a JSON file with service account credentials. Name this `key-file.json`. The structure of this file is given below.

`key-file.json`:
<!-- <<< @/docs/.vuepress/public/examples/circleci-authorizing-the-google-cloud-sdk_examples/key-file.json -->

```json
{
  "type": "service_account",
  "project_id": "project_id",
  "private_key_id": "private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDY9QjNh89vZrS8\nKS1dNMqPRkVbefY9N5cMvw==\n-----END PRIVATE KEY-----\n",
  "client_email": "client_email",
  "client_id": "client_id",
  "auth_uri": "auth_uri",
  "token_uri": "token_uri",
  "auth_provider_x509_cert_url": "auth_provider_x509_cert_url",
  "client_x509_cert_url": "client_x509_cert_url"
}
```

* If you're planning on deploying in your CircleCI job, you should convert this to a single line using:

```bash
cat key-file.json | awk '{print}' ORS=' ' | pbcopy
```

or if that does not work:

```bash
cat key-file.json | awk '{print}' ORS='\\n' | pbcopy
```

Then add an environmental variable called `GCLOUD_SERVICE_KEY` with the value of the previous command (a CTRL+V is enough as `pbcopy` puts it into the clipboard).

## `Makefile`

This `Makefile` uses the [Google Cloud SDK Docker](https://github.com/GoogleCloudPlatform/cloud-sdk-docker) container and configures authentication using the `key-file.json` which you downloaded. **Note:**

* You could have mounted a `volume` with the file `key-file.json` but I've chosen not to.
* We've abstracted the authentication aspect into a variable, `COMMAND_GCLOUD_AUTHENTICATE` that is used by `zones` and `pods`.
* We authorise Docker so pushing to Google Container Registry works, e.g, `docker push gcr.io/www.bana.io/www.bana.io:latest`. This is also why we mount the Docker socket, `-v /var/run/docker.sock:/var/run/docker.sock`.
* The flag `--quiet` runs `gcloud` in non-interactive mode. You want this when running in CI.

<!-- <<< @/docs/.vuepress/public/examples/circleci-authorizing-the-google-cloud-sdk_examples/Makefile -->

```Makefile
COMMAND_GCLOUD_AUTHENTICATE:=set -x \
	&& echo $${GCLOUD_SERVICE_KEY} > /tmp/gcloud-service-key.json \
	&& gcloud auth activate-service-account --key-file=/tmp/gcloud-service-key.json \
	&& gcloud --quiet config set project "circleci-google-cloud-sdk" \
	&& gcloud --quiet config set compute/zone "europe-west2-a" \
	&& gcloud --quiet container clusters get-credentials "circleci-google-cloud-sdk-cluster" --project="circleci-google-cloud-sdk" \
	&& gcloud --quiet auth configure-docker

.PHONY: zones
zones:
	@echo -e "\033[92m  ---> testing authentication \033[0m"
	@docker run --rm -it \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-e GCLOUD_SERVICE_KEY='$(GCLOUD_SERVICE_KEY)' \
		google/cloud-sdk:latest \
		/bin/bash -c ' \
      $(COMMAND_GCLOUD_AUTHENTICATE) \
      && gcloud compute zones list \
    '

.PHONY: pods
pods:
	@echo -e "\033[92m  ---> testing authentication \033[0m"
	@docker run --rm -it \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-e GCLOUD_SERVICE_KEY='$(GCLOUD_SERVICE_KEY)' \
		google/cloud-sdk:latest \
		/bin/bash -c ' \
      $(COMMAND_GCLOUD_AUTHENTICATE) \
      && kubectl get pods \
    '
```

## `.circleci/config.yml`

<!-- <<< @/docs/.vuepress/public/examples/circleci-authorizing-the-google-cloud-sdk_examples/.circleci/config.yml -->

```yaml
version: 2
jobs:
  build:
    machine:
      enabled: true
      docker_layer_caching: true
    resource_class: xlarge
    working_directory: ~/circleci-google-cloud-sdk
    steps:
      - checkout:
          path: ~/circleci-google-cloud-sdk
      - run:
          name: pushing images
          environment:
            # output of this command:
            # $ cat key-file.json | awk '{print}' ORS=' '
            GCLOUD_SERVICE_KEY: GCLOUD_SERVICE_KEY
          command: |
            set -ueo pipefail
            make zones
            make pods
workflows:
  version: 2
  test-deploy:
    jobs:
      - build:
```

## Guides

* [https://cloud.google.com/sdk/docs/authorizing#authorizing_with_a_service_account](https://cloud.google.com/sdk/docs/authorizing#authorizing_with_a_service_account)
* [https://circleci.com/docs/2.0/deployment-integrations/#google-cloud](https://circleci.com/docs/2.0/deployment-integrations/#google-cloud)
* [https://circleci.com/docs/2.0/google-auth/](https://circleci.com/docs/2.0/google-auth/)
