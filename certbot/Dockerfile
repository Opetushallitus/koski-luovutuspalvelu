FROM alpine:3.17@sha256:b6ca290b6b4cdcca5b3db3ffa338ee0285c11744b4a6abaa9627746ee3291d8d

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
