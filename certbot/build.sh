#!/bin/bash
set -e

mkdir -p target
scripts/create-buildversion.sh target/buildversion.txt
docker build -t koski-luovutuspalvelu-certbot:latest .

