#!/bin/bash
set -euo pipefail

echo "Pushing images to ECR..."

ECR_REPO="190073735177.dkr.ecr.eu-west-1.amazonaws.com/utility"
DOCKER_TAG_NAME="ci-${TRAVIS_BUILD_NUMBER}"

$(aws ecr get-login --no-include-email)

for ARTIFACT_NAME in koski-luovutuspalvelu-proxy koski-luovutuspalvelu-certbot; do
  docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:latest
  docker tag ${ARTIFACT_NAME}:latest ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_REPO}/${ARTIFACT_NAME}:latest
done

echo "Images pushed to ECR"
