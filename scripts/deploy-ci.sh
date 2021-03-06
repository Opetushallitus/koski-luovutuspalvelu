#!/bin/bash
set -euo pipefail

echo "Pushing images to ECR..."

AWS_REGION="eu-west-1"
ECR_HOST="190073735177.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="utility"
DOCKER_TAG_NAME="ci-${TRAVIS_BUILD_NUMBER}"

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_HOST}

for ARTIFACT_NAME in koski-luovutuspalvelu-proxy koski-luovutuspalvelu-certbot; do
  docker tag ${ARTIFACT_NAME}:latest ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:latest
  docker tag ${ARTIFACT_NAME}:latest ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:latest
done

echo "Images pushed to ECR"

echo "Restarting..."
aws lambda invoke \
  --function-name 500150530292:koski-luovutuspalvelu-proxy-restart \
  --payload '{"travisBuildNumber": "'$TRAVIS_BUILD_NUMBER'", "vcsRevision": "'$TRAVIS_COMMIT'"}' \
  /dev/stdout

echo "Deploy done."
