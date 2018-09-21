FROM alpine:3.8

RUN apk add --no-cache python libssl1.0 openssl ca-certificates py-cryptography py-openssl py2-pip \
  && pip install --no-cache-dir certbot certbot-dns-route53

COPY main.py /root
COPY target/buildversion.txt /root
CMD cat /root/buildversion.txt && python /root/main.py
