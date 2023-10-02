FROM alpine:3.17.5@sha256:7298bd41b8aee1adde2a0a2819f695b5057bfd0234bf250f0e5d9946c7ab38bd

RUN apk add --no-cache python3 openssl ca-certificates py3-cryptography py3-openssl \
  && python3 -m venv /opt/python3-certbot \
  && /opt/python3-certbot/bin/pip install --upgrade pip

WORKDIR /pip
COPY requirements.txt .
RUN /opt/python3-certbot/bin/pip install --no-cache-dir -r /pip/requirements.txt

WORKDIR /root
COPY main.py .
COPY target/buildversion.txt .
CMD cat /root/buildversion.txt && /opt/python3-certbot/bin/python3 /root/main.py
