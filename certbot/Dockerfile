FROM alpine:3.8

RUN apk add --no-cache --virtual .certbot-deps python libffi libssl1.0 openssl ca-certificates binutils

RUN apk add --no-cache --virtual .build-deps gcc linux-headers openssl-dev musl-dev libffi-dev python-dev \
  && python -m ensurepip \
  && rm -r /usr/lib/python*/ensurepip \
  && pip install --upgrade pip setuptools \
  && pip install --no-cache-dir certbot certbot-dns-route53 \
  && apk del .build-deps

COPY main.py /root
COPY target/buildversion.txt /etc/nginx/html/koski-luovutuspalvelu/
CMD python /root/main.py

