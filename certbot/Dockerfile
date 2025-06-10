FROM alpine:3.22.0@sha256:8a1f59ffb675680d47db6337b49d22281a139e9d709335b492be023728e11715

RUN apk add --no-cache python3 openssl ca-certificates py3-cryptography py3-openssl \
  && python3 -m venv /opt/python3-certbot \
  && /opt/python3-certbot/bin/pip install --upgrade pip

WORKDIR /pip
COPY requirements.txt .
RUN /opt/python3-certbot/bin/pip install --no-cache-dir -r /pip/requirements.txt

WORKDIR /root
COPY main.py .
CMD /opt/python3-certbot/bin/python3 /root/main.py
