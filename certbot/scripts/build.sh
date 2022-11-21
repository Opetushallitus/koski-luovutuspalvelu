#!/bin/bash
set -e

mkdir -p target
scripts/create-buildversion.sh target/buildversion.txt
../scripts/check-base-image-date.sh Dockerfile 120
docker build --pull -t koski-luovutuspalvelu-certbot:latest .
