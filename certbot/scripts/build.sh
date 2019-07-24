#!/bin/bash
set -e

mkdir -p target
scripts/create-buildversion.sh target/buildversion.txt
docker build --pull -t koski-luovutuspalvelu-certbot:latest .
