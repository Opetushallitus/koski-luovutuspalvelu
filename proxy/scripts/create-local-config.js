const fs = require('fs')
const os = require('os')
const path = require('path')

function getMyIp() {
  const addresses = Object.values(os.networkInterfaces()).reduce((acc, v) => acc.concat(v))
  return addresses.find(a => a.family === 'IPv4' && !a.internal).address
}

const myIp = getMyIp()

const config = {
  proxyCertificate: fs.readFileSync(path.join(__dirname, '../test/testca/certs/proxy.crt'), 'UTF-8'),
  proxyPrivateKey: fs.readFileSync(path.join(__dirname, '../test/testca/private/proxy.key'), 'UTF-8'),
  testCaCertificate: fs.readFileSync(path.join(__dirname, '../test/testca/certs/root-ca.crt'), 'UTF-8'),
  koskiUrl: `http://${myIp}:7023`,
  clientList: [
    {subjectDn: 'CN=client.example.com,O=Testi,C=FI', ips: ['0.0.0.0/0'], user: 'clientuser'},
    {subjectDn: 'CN=client123.example.com,O=Testi,C=FI', ips: ['192.168.1.1/32', '192.168.2.2/32'], user: 'clientuser123'}
  ],
  passwords: {
    'clientUser': 'dummy123',
    'clientUser123': 'dummy456'
  }
}

console.log(JSON.stringify(config, null, 2))