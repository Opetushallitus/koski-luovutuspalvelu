#!/bin/bash
set -e
set -o pipefail

echo "Starting upload-image.sh"

ECR_REPO="190073735177.dkr.ecr.eu-west-1.amazonaws.com/utility"
ARTIFACT_NAME="koski-luovutuspalvelu-proxy"
DOCKER_TAG_NAME="ci-${TRAVIS_BUILD_NUMBER}"

echo "Logging in to ECR"
$(aws ecr get-login --no-include-email)
echo "Login succeeded"

docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:latest
docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
docker push ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
docker push ${ECR_REPO}/${ARTIFACT_NAME}:latest
echo "Done"
