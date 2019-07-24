FROM alpine:3.10

RUN apk add --no-cache python openssl ca-certificates py-cryptography py-openssl py2-pip \
  && pip install --no-cache-dir certbot==0.36.0 certbot-dns-route53==0.36.0

COPY main.py /root
COPY target/buildversion.txt /root
CMD cat /root/buildversion.txt && python /root/main.py
