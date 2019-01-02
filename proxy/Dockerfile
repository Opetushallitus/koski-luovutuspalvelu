FROM debian:stretch-slim

EXPOSE 443

# Based on https://github.com/openresty/docker-openresty/blob/master/stretch/Dockerfile
COPY src/openresty-pubkey.gpg /tmp/
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --no-install-suggests -y gnupg2 \
  && DEBIAN_FRONTEND=noninteractive apt-key add /tmp/openresty-pubkey.gpg \
  && echo "deb http://openresty.org/package/debian stretch openresty" >> /etc/apt/sources.list \
  && DEBIAN_FRONTEND=noninteractive apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --no-install-suggests -y python python-pip openssl ca-certificates openresty \
  && DEBIAN_FRONTEND=noninteractive apt-get remove -y --purge gnupg2 \
  && DEBIAN_FRONTEND=noninteractive apt-get autoremove -y \
  && pip install --no-cache-dir boto3 \
  && rm -rf /var/lib/apt/lists/*

# Add "VRK CA for Service Providers - G3" and "VRK Gov. Root CA" from https://eevertti.vrk.fi/ca-varmenteet
WORKDIR /
COPY src/vrksp3.crt src/vrkrootc.crt /tmp/
RUN openssl x509 -in /tmp/vrksp3.crt -inform der -out /usr/share/ca-certificates/vrksp3.crt -outform pem \
  && openssl x509 -in /tmp/vrkrootc.crt -inform der -out /usr/share/ca-certificates/vrkrootc.crt -outform pem \
  && echo "vrksp3.crt" >> /etc/ca-certificates.conf \
  && echo "vrkrootc.crt" >> /etc/ca-certificates.conf \
  && update-ca-certificates

# Download lua-resty-iputils and xml2lua libraries
# https://github.com/hamishforbes/lua-resty-iputils
# https://github.com/manoelcampos/xml2lua
ADD \
  https://raw.githubusercontent.com/hamishforbes/lua-resty-iputils/0fb338577eeccd192df4c78bb27a083f481a7a6f/lib/resty/iputils.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/4cd862f21a7496b4196086e760ba03f5449c14bf/xmlhandler/tree.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/4cd862f21a7496b4196086e760ba03f5449c14bf/XmlParser.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/4cd862f21a7496b4196086e760ba03f5449c14bf/xml2lua.lua \
  /usr/local/openresty/site/lualib/
RUN chmod a+r /usr/local/openresty/site/lualib/*.lua

COPY src/entrypoint.sh src/get-config-from-aws.py src/setup-certs.py src/nginx.conf /etc/nginx/
COPY src/luovutuspalvelu-config.lua src/xroad-soap-util.lua /usr/local/openresty/site/lualib/
COPY target/buildversion.txt /etc/nginx/html/koski-luovutuspalvelu/

CMD ["/bin/bash", "-c", "/etc/nginx/entrypoint.sh"]
