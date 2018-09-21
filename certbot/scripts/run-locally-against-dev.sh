#!/bin/bash
docker rm -f koski-luovutuspalvelu-certbot || true
docker \
    run --name koski-luovutuspalvelu-certbot \
    -e AWS_PROFILE=oph-koski-dev \
    -e CERTBOT_DOMAIN=local-certbot-test.koski-luovutuspalvelu-dev.testiopintopolku.fi \
    -e CERTBOT_PARAMETER_PREFIX=/local-certbot-test/koski-luovutuspalvelu \
    -v ${HOME}/.aws:/root/.aws:ro \
    koski-luovutuspalvelu-certbot:latest
