#!/bin/bash
set -e

echo Starting koski-luovutuspalvelu-proxy: $(cat /etc/nginx/html/koski-luovutuspalvelu/buildversion.txt)

if [ -e /etc/nginx/koski-luovutuspalvelu-proxy-config.json ]; then
  echo "Using existing configuration file"
elif [ ! -z "$ENVIRONMENT_PARAMETER_PREFIX" ]; then
  echo "Getting configuration from parameter store prefix $ENVIRONMENT_PARAMETER_PREFIX"
  python /etc/nginx/get-config-from-aws.py
else
  echo "Configuration for koski-luovutuspalvelu-proxy missing"
  exit 1
fi

echo Setting up certificates
python /etc/nginx/setup-certs.py
echo Building nginx.conf
python /etc/nginx/build-nginx-conf.py
ln -sf /usr/local/openresty/nginx/conf/mime.types /etc/nginx/

echo Starting Nginx
exec nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
