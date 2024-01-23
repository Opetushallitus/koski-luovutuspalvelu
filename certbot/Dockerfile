FROM alpine:3.19.0@sha256:13b7e62e8df80264dbb747995705a986aa530415763a6c58f84a3ca8af9a5bcd

RUN apk add --no-cache python3 openssl ca-certificates py3-cryptography py3-openssl \
  && python3 -m venv /opt/python3-certbot \
  && /opt/python3-certbot/bin/pip install --upgrade pip

WORKDIR /pip
COPY requirements.txt .
RUN /opt/python3-certbot/bin/pip install --no-cache-dir -r /pip/requirements.txt

WORKDIR /root
COPY main.py .
CMD /opt/python3-certbot/bin/python3 /root/main.py
