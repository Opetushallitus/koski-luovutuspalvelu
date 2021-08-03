import json
import os

config = json.load(open('/etc/nginx/koski-luovutuspalvelu-proxy-config.json'))

with open('/etc/ssl/proxy.crt', 'w') as f:
    f.write(config['proxyCertificate'])
with open('/etc/ssl/proxy.key', 'w') as f:
    f.write(config['proxyPrivateKey'])
with open('/etc/ssl/extra-ca-certificates.crt', 'w') as f:
    f.write(''.join([x.strip() + '\n' for x in config.get('extraCaCertificates', [])]))

os.system('cat /etc/ssl/extra-ca-certificates.crt /etc/ssl/certs/ca-certificates.crt > /etc/nginx/ca-certificates.crt')
os.system('echo accepting following ca-certificates:')
os.system('cat /etc/nginx/ca-certificates.crt')
