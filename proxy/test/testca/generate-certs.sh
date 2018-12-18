#!/bin/bash

set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

if [ -d certs -a "$1" != "-f" ]; then
  exit 0
fi

rm -rf certs csr db private newcerts
mkdir -p certs csr db private newcerts
touch db/root-ca.index
echo 1000 > db/root-ca.serial
echo 1000 > db/root-ca.crlnumber

openssl genrsa -out private/root-ca.key 2048
openssl req -config openssl.cnf -key private/root-ca.key \
    -new -x509 -days 3650 -sha256 -extensions root_ca \
    -subj '/CN=TestCA' \
    -out certs/root-ca.crt

openssl genrsa -out private/proxy.key 2048
openssl req -config openssl.cnf -key private/proxy.key -new -sha256 -out csr/proxy.req -subj '/CN=localhost'
openssl ca -config openssl.cnf -in csr/proxy.req -out certs/proxy.crt -extensions server_cert -notext -batch

openssl genrsa -out private/client.key 2048
openssl req -config openssl.cnf -key private/client.key -new -sha256 -out csr/client.req -subj '/C=FI/O=Testi/CN=client.example.com'
openssl ca -config openssl.cnf -in csr/client.req -out certs/client.crt -extensions server_cert -notext -batch

openssl genrsa -out private/client2.key 2048
openssl req -config openssl.cnf -key private/client2.key -new -sha256 -out csr/client2.req -subj '/C=FI/O=Testi/CN=client2.example.com'
openssl ca -config openssl.cnf -in csr/client2.req -out certs/client2.crt -extensions server_cert -notext -batch

openssl genrsa -out private/client3.key 2048
openssl req -config openssl.cnf -key private/client3.key -new -sha256 -out csr/client3.req -subj '/C=FI/O=Testi/CN=client3.example.com'
openssl ca -config openssl.cnf -in csr/client3.req -out certs/client3.crt -extensions server_cert -notext -batch

openssl genrsa -out private/client4.key 2048
openssl req -config openssl.cnf -key private/client4.key -new -sha256 -out csr/client4.req -subj '/C=FI/O=Testi/CN=client4.example.com'
openssl ca -config openssl.cnf -in csr/client4.req -out certs/client4.crt -extensions server_cert -notext -batch

openssl genrsa -out private/selfsigned.key 2048
openssl req -config openssl.cnf -key private/selfsigned.key \
    -new -x509 -days 3650 -sha256 -extensions server_cert \
    -subj '/C=FI/O=Testi/CN=client.example.com' \
    -out certs/selfsigned.crt
