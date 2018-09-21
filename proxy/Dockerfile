FROM nginx:1.15

EXPOSE 443

RUN apt-get update \
  && apt-get install --no-install-recommends --no-install-suggests -y python python-pip openssl ca-certificates python-jinja2 \
  && pip install --no-cache-dir boto3 \
  && rm -rf /var/lib/apt/lists/*

# Add "VRK CA for Service Providers - G3" from https://eevertti.vrk.fi/ca-varmenteet
WORKDIR /
COPY src/vrksp3.crt /tmp
RUN openssl x509 -in /tmp/vrksp3.crt -inform der -out /usr/share/ca-certificates/vrksp3.crt -outform pem \
  && echo "vrksp3.crt" >> /etc/ca-certificates.conf \
  && update-ca-certificates

COPY src/entrypoint.sh src/get-config-from-aws.py src/setup-certs.py src/build-nginx-conf.py src/nginx.conf.j2 src/passwords.conf.j2 /etc/nginx/
COPY target/buildversion.txt /etc/nginx/html/koski-luovutuspalvelu/
CMD ["/bin/bash", "-c", "/etc/nginx/entrypoint.sh"]
