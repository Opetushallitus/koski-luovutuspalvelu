FROM alpine:3.20.0@sha256:77726ef6b57ddf65bb551896826ec38bc3e53f75cdde31354fbffb4f25238ebd

RUN apk add --no-cache python3 openssl ca-certificates py3-cryptography py3-openssl \
  && python3 -m venv /opt/python3-certbot \
  && /opt/python3-certbot/bin/pip install --upgrade pip

WORKDIR /pip
COPY requirements.txt .
RUN /opt/python3-certbot/bin/pip install --no-cache-dir -r /pip/requirements.txt

WORKDIR /root
COPY main.py .
CMD /opt/python3-certbot/bin/python3 /root/main.py
