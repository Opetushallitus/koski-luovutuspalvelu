#!/bin/bash
set -e

echo "Starting koski-luovutuspalvelu-proxy: $(cat /etc/nginx/html/koski-luovutuspalvelu/buildversion.txt)"

if [ -e /etc/nginx/koski-luovutuspalvelu-proxy-config.json ]; then
  echo "Using existing configuration file"
elif [ -n "$ENVIRONMENT_PARAMETER_PREFIX" ]; then
  echo "Getting configuration from parameter store prefix $ENVIRONMENT_PARAMETER_PREFIX"
  python3 /etc/nginx/get-config-from-aws.py
else
  echo "Configuration for koski-luovutuspalvelu-proxy missing"
  exit 1
fi

echo Setting up certificates
python3 /etc/nginx/setup-certs.py

echo Setting up DNS
echo resolver "$(awk 'BEGIN{ORS=" "} $1=="nameserver" {print $2}' /etc/resolv.conf)" ";" >/etc/nginx/resolvers.conf

ln -sf /usr/local/openresty/nginx/conf/mime.types /etc/nginx/

echo Starting Nginx
exec /usr/local/openresty/nginx/sbin/nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
