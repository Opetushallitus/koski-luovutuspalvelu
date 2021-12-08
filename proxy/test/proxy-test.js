const gotModule = require('got')
const express = require('express')
const fs = require('fs')

const expect = require('chai').expect

const proxyPort = 7022
const koskiMockPort = 7023

const koskiMockApp = express()
koskiMockApp.all('/*', (req, res) => {
  // uncomment this to debug test failures
  // console.log(`koskiMockApp: ${req.url}`, req.headers)
  if (req.originalUrl.includes('notfound')) {
    res.status(404)
  }
  if (req.originalUrl.includes('unauthorized')) {
    res.status(403)
  }
  res.json({koskiMock: {url: req.url, headers: req.headers}})
})
const koskiMockServer = koskiMockApp.listen(koskiMockPort)
after(() => { if (koskiMockServer) koskiMockServer.close() })

const baseUrl = `https://localhost:${proxyPort}`

const gotWithoutClientCert = gotModule.extend({
  prefixUrl: baseUrl,
  throwHttpErrors: false,
  followRedirect: false,
  allowGetBody: true,
  retry: {limit: 0},
  ca: fs.readFileSync(__dirname + '/testca/certs/root-ca.crt')
})

const gotWithClientCert = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/client.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/client.crt'),
})

const gotWithClientCert2 = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/client2.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/client2.crt'),
})

const gotWithClientCert3 = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/client3.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/client3.crt'),
})

const gotWithClientCert4 = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/client4.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/client4.crt'),
})

const gotWithClientCert5 = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/client5.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/client5.crt'),
})

const gotWithSelfSignedClientCert = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/selfsigned.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/selfsigned.crt'),
})

const exampleSoapRequest = `
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers">
  <SOAP-ENV:Header>
      <xrd:client id:objectType="SUBSYSTEM">
          <id:xRoadInstance>FI-TEST</id:xRoadInstance>
          <id:memberClass>GOV</id:memberClass>
          <id:memberCode>0245437-2</id:memberCode>
          <id:subsystemCode>ServiceViewClient</id:subsystemCode>
      </xrd:client>
      <xrd:service id:objectType="SERVICE">
         <id:xRoadInstance>FI-TEST</id:xRoadInstance>
         <id:memberClass>GOV</id:memberClass>
         <id:memberCode>2769790-1</id:memberCode>
         <id:subsystemCode>koski</id:subsystemCode>
         <id:serviceCode>suomiFiRekisteritiedot</id:serviceCode>
         <id:serviceVersion>v1</id:serviceVersion>
      </xrd:service>
      <xrd:protocolVersion>4.0</xrd:protocolVersion>
      <xrd:id>ID123</xrd:id>
      <xrd:userId>ID456</xrd:userId>
   </SOAP-ENV:Header>
   <SOAP-ENV:Body>
     <ns1:suomiFiRekisteritiedot xmlns:ns1="http://docs.koski-xroad.fi/producer">
       <ns1:hetu>010280-952L</ns1:hetu>
     </ns1:suomiFiRekisteritiedot>
   </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
`

describe('koski-luovutuspalvelu proxy', () => {

  describe('/koski-luovutuspalvelu/healthcheck', () => {

    it('responds to proxy health check', async () => {
      const res = await gotWithoutClientCert('koski-luovutuspalvelu/healthcheck/proxy')
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.statusCode).to.equal(200)
    })

  })

  describe('/koski-luovutuspalvelu/buildversion.txt', () => {

    it('returns build version', async () => {
      const res = await gotWithoutClientCert('koski-luovutuspalvelu/buildversion.txt')
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.body).to.include('vcsRevision=')
    })

  })

  describe('/robots.txt', () => {

    it('disallows everything', async () => {
      const res = await gotWithoutClientCert('robots.txt')
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.headers).to.have.property('content-type', 'text/plain')
      expect(res.body).to.equal('User-Agent: *\nDisallow: /\n')
    })

  })

  describe('/koski/api/luovutuspalvelu', () => {

    it('proxies API calls to Koski', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('koskiMock.url', '/koski/api/luovutuspalvelu/hetu')
    })

    it('adds basic authentication to request', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property(
        'koskiMock.headers.authorization',
        'Basic ' + Buffer.from('clientuser:dummy123').toString('base64')
      )
    })

    it('replaces X-Forwarded-For/X-Forwarded-Proto headers', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/hetu', {
        json: true,
        headers: {
          'X-Forwarded-For': '192.168.1.1',
          'X-Forwarded-Proto': 'smtp'
        }
      })
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('koskiMock.headers')
      const headers = bodyJson.koskiMock.headers
      expect(headers).to.have.property('x-forwarded-for')
      expect(headers['x-forwarded-for']).to.not.include('192.168.1.1')
      expect(headers).to.have.property('x-forwarded-proto', 'https')

    })

    it('removes Forwarded and Cookie headers (might confuse Koski backend)', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/hetu', {
        json: true,
        headers: {
          'Forwarded': 'for=192.168.1.1',
          'Cookie': 'test=1',
        }
      })
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('koskiMock.headers')
      const headers = bodyJson.koskiMock.headers
      expect(headers).not.to.have.property('forwarded')
      expect(headers).not.to.have.property('cookie')
    })

    it('adds Caller-Id header', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property(
        'koskiMock.headers.caller-id',
        '1.2.246.562.10.00000000001.koski-luovutuspalvelu-proxy'
      )
    })

    it('proxies 403 status code from Koski', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/unauthorized', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
    })

    it('proxies 404 status code from Koski', async () => {
      const res = await gotWithClientCert('koski/api/luovutuspalvelu/notfound', {json: true})
      expect(res.statusCode).to.equal(404)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
    })

    it('requires SSL client certificate', async () => {
      const res = await gotWithoutClientCert('koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.clientCertificateRequired')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.deep.equal([{"key": "unauthorized.clientCertificateRequired", "message": "Varmenne puuttuu"}])
    })

    it('requires known SSL client certificate', async () => {
      const res = await gotWithClientCert2('koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownClientCertificate')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.deep.equal([{"key": "unauthorized.unknownClientCertificate", "message": "Tuntematon varmenne: CN=client2.example.com,O=Testi,C=FI"}])
    })

    it('does not accept self-signed SSL client certificate', async () => {
      const res = await gotWithSelfSignedClientCert('koski/api/luovutuspalvelu/self', {json: true})
      expect(res.statusCode).to.equal(400)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.sslCertificateError')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.deep.equal([{"key": "unauthorized.sslCertificateError", "message": "FAILED:self signed certificate"}])
    })

    it('does not accept connections from unknown IP address', async () => {
      const res = await gotWithClientCert3('koski/api/luovutuspalvelu/ip', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownIpAddress')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('0.key', 'unauthorized.unknownIpAddress')
    })

    it('returns graceful error when password is missing from config', async () => {
      const res = await gotWithClientCert5('koski/api/luovutuspalvelu/missing', {json: true})
      expect(res.statusCode).to.equal(500)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=internalError.missingPassword')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('0.key', 'internalError.missingPassword')
    })

  })

  describe('/koski/api/palveluvayla', () => {

    it('proxying is not allowed if xroadSecurityServer flag is not set', async () => {
      const res = await gotWithClientCert('koski/api/palveluvayla/soapSomething', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.xroadSecurityServerOnly')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('0.key', 'unauthorized.xroadSecurityServerOnly')
    })

    it('proxying works if xroadSecurityServer flag is set', async () => {
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomething', {method: 'POST', body: exampleSoapRequest, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('koskiMock.url', '/koski/api/palveluvayla/soapSomething')
      expect(bodyJson).to.have.nested.property(
        'koskiMock.headers.authorization',
        'Basic ' + Buffer.from('clientuser5:dummy321').toString('base64')
      )
    })

    it('requires known xroad client', async () => {
      const requestBody = exampleSoapRequest.replace('ServiceViewClient', 'UnknownClient')
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomething', {method: 'POST', body: requestBody, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownXroadClient')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('0.key', 'unauthorized.unknownXroadClient')
    })

    it('does not accept GET method', async () => {
      const res = await gotWithClientCert4('koski/api/palveluvayla/getSoapSomething', {method: 'GET'})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.method')
    })

    it('does not accept invalid XML', async () => {
      const requestBody = '{"thisIsNotXml": true}'
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomethingNotXml', {method: 'POST', body: requestBody, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(400)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=badRequest')
    })

    it('does not accept missing subsystemCode', async () => {
      const requestBody = exampleSoapRequest.replace(/id:subsystemCode/g, 'id:somethingCode')
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomething', {method: 'POST', body: requestBody, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(400)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=badRequest')
    })


  })

  describe('other URLs', () => {
    it('/ returns 404 foo', async () => {
      const res = await gotWithoutClientCert('')
      expect(res.headers).to.have.property('x-log', 'proxyResponse=notFound')
      expect(res.statusCode).to.equal(404)
    })
    it('/koski/api/koodisto/opiskeluoikeudentyyppi/latest returns 404', async () => {
      const res = await gotWithoutClientCert('koski/api/koodisto/opiskeluoikeudentyyppi/latest')
      expect(res.headers).to.have.property('x-log', 'proxyResponse=notFound')
      expect(res.statusCode).to.equal(404)
    })
    it('plain http returns 404', async () => {
      const res = await gotWithoutClientCert(baseUrl.replace('https:', 'http:'))
      expect(res.headers).to.have.property('x-log', 'proxyResponse=notFound')
      expect(res.statusCode).to.equal(404)
    })
  })

})
