FROM alpine:3.12

RUN apk add --no-cache python3 openssl ca-certificates py3-cryptography py3-openssl py3-pip \
  && pip install --no-cache-dir certbot==1.9.0 certbot-dns-route53==1.9.0

COPY main.py /root
COPY target/buildversion.txt /root
CMD cat /root/buildversion.txt && python3 /root/main.py
