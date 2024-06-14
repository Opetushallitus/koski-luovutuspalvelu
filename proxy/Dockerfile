FROM debian:bullseye-20240612-slim@sha256:acc5810124f0929ab44fc7913c0ad936b074cbd3eadf094ac120190862ba36c4

EXPOSE 443

# Based on https://github.com/openresty/docker-openresty/blob/master/stretch/Dockerfile
COPY src/openresty-pubkey.gpg /tmp/
RUN DEBIAN_FRONTEND=noninteractive apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --no-install-suggests -y gnupg2 ca-certificates \
  && DEBIAN_FRONTEND=noninteractive apt-key add /tmp/openresty-pubkey.gpg \
  && echo "deb https://openresty.org/package/debian bullseye openresty" >> /etc/apt/sources.list \
  && DEBIAN_FRONTEND=noninteractive apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends --no-install-suggests -y python3-setuptools python3 python3-pip python3-setuptools openssl openresty \
  && DEBIAN_FRONTEND=noninteractive apt-get remove -y --purge gnupg2 \
  && DEBIAN_FRONTEND=noninteractive apt-get autoremove -y \
  && pip3 install --no-cache-dir boto3 \
  && rm -rf /var/lib/apt/lists/*

# Add "VRK CA for Service Providers - G3" and "VRK Gov. Root CA" from https://dvv.fi/ca-varmenteet
WORKDIR /
COPY dvv-crt/* /tmp/
RUN openssl x509 -in /tmp/vrksp3.crt -inform der -out /usr/share/ca-certificates/vrksp3.crt -outform pem \
  && openssl x509 -in /tmp/vrkrootc.crt -inform der -out /usr/share/ca-certificates/vrkrootc.crt -outform pem \
  && openssl x509 -in /tmp/dvvroot3ec.crt -inform der -out /usr/share/ca-certificates/dvvroot3ec.crt -outform pem \
  && openssl x509 -in /tmp/dvvroot3rc.crt -inform der -out /usr/share/ca-certificates/dvvroot3rc.crt -outform pem \
  && openssl x509 -in /tmp/dvvsp5ec.crt -inform der -out /usr/share/ca-certificates/dvvsp5ec.crt -outform pem \
  && openssl x509 -in /tmp/dvvsp5rc.crt -inform der -out /usr/share/ca-certificates/dvvsprc.crt -outform pem \
  && echo "vrksp3.crt" >> /etc/ca-certificates.conf \
  && echo "vrkrootc.crt" >> /etc/ca-certificates.conf \
  && echo "dvvroot3ec.crt" >> /etc/ca-certificates.conf \
  && echo "dvvroot3rc.crt" >> /etc/ca-certificates.conf \
  && echo "dvvsp5ec.crt" >> /etc/ca-certificates.conf \
  && echo "dvvsp5rc.crt" >> /etc/ca-certificates.conf \
  && update-ca-certificates

# Download lua-resty-iputils and xml2lua libraries
# https://github.com/hamishforbes/lua-resty-iputils
# https://github.com/manoelcampos/xml2lua
ADD \
  https://raw.githubusercontent.com/hamishforbes/lua-resty-iputils/0fb338577eeccd192df4c78bb27a083f481a7a6f/lib/resty/iputils.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/7e36b2ecad91841ef41f1be29902ef769807e91d/xmlhandler/tree.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/7e36b2ecad91841ef41f1be29902ef769807e91d/XmlParser.lua \
  https://raw.githubusercontent.com/manoelcampos/xml2lua/7e36b2ecad91841ef41f1be29902ef769807e91d/xml2lua.lua \
  /usr/local/openresty/site/lualib/
RUN chmod a+r /usr/local/openresty/site/lualib/*.lua

COPY src/entrypoint.sh src/get-config-from-aws.py src/setup-certs.py src/nginx.conf /etc/nginx/
COPY src/luovutuspalvelu-config.lua src/xroad-soap-util.lua /usr/local/openresty/site/lualib/
COPY target/buildversion.txt /etc/nginx/html/koski-luovutuspalvelu/

CMD ["/bin/bash", "-c", "/etc/nginx/entrypoint.sh"]

# Use SIGQUIT instead of default SIGTERM to cleanly drain requests
# See https://github.com/openresty/docker-openresty/blob/master/README.md#tips--pitfalls
STOPSIGNAL SIGQUIT
