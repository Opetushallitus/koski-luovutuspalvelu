#!/bin/bash
set -e
set -o pipefail

ECR_REPO="190073735177.dkr.ecr.eu-west-1.amazonaws.com/utility"
ARTIFACT_NAME="koski-luovutuspalvelu-proxy"
DOCKER_TAG_NAME="ci-${TRAVIS_BUILD_NUMBER}"

$(aws ecr get-login --no-include-email)
docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:latest
docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
docker push ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
docker push ${ECR_REPO}/${ARTIFACT_NAME}:latest
