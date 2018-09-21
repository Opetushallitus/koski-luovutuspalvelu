import json
import os

config = json.load(open('/etc/nginx/koski-luovutuspalvelu-proxy-config.json'))

with open('/etc/ssl/proxy.crt', 'w') as f:
    f.write(config['proxyCertificate'])
with open('/etc/ssl/proxy.key', 'w') as f:
    f.write(config['proxyPrivateKey'])
with open('/etc/ssl/testca.crt', 'w') as f:
  f.write(config.get('testCaCertificate', ''))
  
os.system('cat /etc/ssl/testca.crt /etc/ssl/certs/ca-certificates.crt > /etc/nginx/ca-certificates.crt')
