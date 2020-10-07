#!/bin/bash
set -e
docker rm -f koski-luovutuspalvelu-proxy || true
docker run --name koski-luovutuspalvelu-proxy -e AWS_PROFILE=oph-koski-dev -e ENVIRONMENT_PARAMETER_PREFIX=/dev/koski-luovutuspalvelu -p 7022:443 -v ${HOME}/.aws:/root/.aws:ro koski-luovutuspalvelu-proxy:latest bash -c 'python3 /etc/nginx/get-config-from-aws.py && cat /etc/nginx/koski-luovutuspalvelu-proxy-config.json'
