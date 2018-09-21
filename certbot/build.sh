#!/bin/bash
set -e

mkdir -p target
scripts/create-buildversion.sh target/buildversion.txt
docker build --pull --cache-from koski-luovutuspalvelu-certbot:latest -t koski-luovutuspalvelu-certbot:latest .

