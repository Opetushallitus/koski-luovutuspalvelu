#!/bin/bash
set -euo pipefail

echo "Pushing images to ECR..."

AWS_REGION="eu-west-1"
ECR_HOST="190073735177.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="utility"

if [ -z "$DOCKER_TAG_NAME" ]; then
    echo "Parameter DOCKER_TAG_NAME not provided. See latest version from AWS ECR."
    exit 1
fi

aws ecr get-login-password --region ${AWS_REGION} --profile oph-utility | docker login --username AWS --password-stdin ${ECR_HOST}

for ARTIFACT_NAME in koski-luovutuspalvelu-proxy koski-luovutuspalvelu-certbot; do
  docker tag ${ARTIFACT_NAME}:latest ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:latest
  docker tag ${ARTIFACT_NAME}:latest ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:${DOCKER_TAG_NAME}
  docker push ${ECR_HOST}/${ECR_REPO}/${ARTIFACT_NAME}:latest
done

echo "Images pushed to ECR"
