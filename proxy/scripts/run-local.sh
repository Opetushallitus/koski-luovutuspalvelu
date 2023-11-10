#!/bin/bash
set -e

config=target/koski-luovutuspalvelu-proxy-config-local.json
node scripts/create-local-config.js > "$config"

docker rm -f koski-luovutuspalvelu-proxy || true
docker run --name koski-luovutuspalvelu-proxy -p 7022:443 -v "$PWD/$config:/etc/nginx/koski-luovutuspalvelu-proxy-config.json:ro" koski-luovutuspalvelu-proxy:latest
