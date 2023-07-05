#!/bin/bash
set -euo pipefail

echo "Pushing images to ECR..."

AWS_REGION="eu-west-1"
ECR_HOST="190073735177.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPO="utility"
DOCKER_TAG_NAME="ci-${TRAVIS_BUILD_NUMBER}"

aws ecr get-login-password --region ${AWS_REGION} --profile oph-utility | docker login --username AWS --password-stdin ${ECR_HOST}

docker tag koski-luovutuspalvelu-proxy:latest ${ECR_HOST}/${ECR_REPO}/koski-luovutuspalvelu-proxy:latest
docker tag koski-luovutuspalvelu-proxy:latest ${ECR_HOST}/${ECR_REPO}/koski-luovutuspalvelu-proxy:${DOCKER_TAG_NAME}
docker push ${ECR_HOST}/${ECR_REPO}/koski-luovutuspalvelu-proxy:${DOCKER_TAG_NAME}
docker push ${ECR_HOST}/${ECR_REPO}/koski-luovutuspalvelu-proxy:latest

echo "koski-luovutuspalvelu-proxy pushed to ECR"
