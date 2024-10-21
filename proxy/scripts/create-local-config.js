const fs = require('fs')
const os = require('os')
const path = require('path')

const myIp = getMyIp()

const koskiBackendHost =
  process.env.KOSKI_BACKEND_HOST || `http://${myIp}:7023`

const clientUserName =
  process.env.CLIENT_USERNAME || 'clientuser'

const clientPassword =
  process.env.CLIENT_PASSWORD || 'dummy123'

function getMyIp() {
  const addresses = Object.values(os.networkInterfaces()).reduce((acc, v) => acc.concat(v))
  return addresses.find(a => a.family === 'IPv4' && !a.internal).address
}


const config = {
  proxyCertificate: fs.readFileSync(path.join(__dirname, '../test/testca/certs/proxy.crt'), 'UTF-8'),
  proxyPrivateKey: fs.readFileSync(path.join(__dirname, '../test/testca/private/proxy.key'), 'UTF-8'),
  extraCaCertificates: [
    fs.readFileSync(path.join(__dirname, '../test/testca/certs/root-ca.crt'), 'UTF-8')
  ],
  koskiUrl: koskiBackendHost,
  clientList: [
    {subjectDn: 'CN=client.example.com,O=Testi,C=FI', ips: ['0.0.0.0/0'], user: clientUserName},
    {subjectDn: 'CN=client3.example.com,O=Testi,C=FI', ips: ['192.168.1.1/32'], user: clientUserName},
    {subjectDn: 'CN=client123.example.com,O=Testi,C=FI', ips: ['192.168.1.1/32', '192.168.2.2/32'], user: 'clientuser123'},
    {subjectDn: 'CN=client4.example.com,O=Testi,C=FI', ips: ['0.0.0.0/0'], xroadSecurityServer: true},
    {subjectDn: 'CN=client5.example.com,O=Testi,C=FI', ips: ['0.0.0.0/0'], user: 'missingpassword'}
  ],
  xroadClients: {
    'SUBSYSTEM:FI-TEST/GOV/0245437-2/ServiceViewClient': {user: 'clientuser5'}
  },
  passwords: {
    [clientUserName]: clientPassword,
    'clientuser123': 'dummy456',
    'clientuser4': 'dummy789',
    'clientuser5': 'dummy321'
  },
  testLogging: true
}

console.log(JSON.stringify(config, null, 2))
