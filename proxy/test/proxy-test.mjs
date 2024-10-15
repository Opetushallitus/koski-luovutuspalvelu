import { default as gotModule } from 'got'
import { default as express } from 'express'
import * as fs from 'fs'
import { spawn } from 'child_process'
import { expect } from 'chai'

const __dirname = new URL('.', import.meta.url).pathname

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
  https: { certificateAuthority: fs.readFileSync(__dirname + '/testca/certs/root-ca.crt') }
})

const gotWithCert = (name) => gotWithoutClientCert.extend({
  https: {
    key: fs.readFileSync(`${__dirname}testca/private/${name}.key`),
    certificate: fs.readFileSync(`${__dirname}testca/certs/${name}.crt`)
  }
})

const gotWithClientCert = gotWithCert('client')
const gotWithClientCert2 = gotWithCert('client2')
const gotWithClientCert3 = gotWithCert('client3')
const gotWithClientCert4 = gotWithCert('client4')
const gotWithClientCert5 = gotWithCert('client5')
const gotWithSelfSignedClientCert = gotWithCert('selfsigned')

const exampleSoapRequest = `
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header>
      <xrd:client xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SUBSYSTEM">
          <id:xRoadInstance xmlns:id="http://x-road.eu/xsd/identifiers">FI-TEST</id:xRoadInstance>
          <id:memberClass xmlns:id="http://x-road.eu/xsd/identifiers">GOV</id:memberClass>
          <id:memberCode xmlns:id="http://x-road.eu/xsd/identifiers">0245437-2</id:memberCode>
          <id:subsystemCode xmlns:id="http://x-road.eu/xsd/identifiers">ServiceViewClient</id:subsystemCode>
      </xrd:client>
      <xrd:service xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SERVICE">
          <id:xRoadInstance xmlns:id="http://x-road.eu/xsd/identifiers">FI-TEST</id:xRoadInstance>
          <id:memberClass xmlns:id="http://x-road.eu/xsd/identifiers">GOV</id:memberClass>
          <id:memberCode xmlns:id="http://x-road.eu/xsd/identifiers">2769790-1</id:memberCode>
          <id:subsystemCode xmlns:id="http://x-road.eu/xsd/identifiers">koski</id:subsystemCode>
          <id:serviceCode xmlns:id="http://x-road.eu/xsd/identifiers">suomiFiRekisteritiedot</id:serviceCode>
          <id:serviceVersion xmlns:id="http://x-road.eu/xsd/identifiers">v1</id:serviceVersion>
      </xrd:service>
      <xrd:protocolVersion xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">4.0</xrd:protocolVersion>
      <xrd:userId xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">jdoe</xrd:userId>
      <xrd:id xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">38997cf6400edd85</xrd:id>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
      <ns1:suomiFiRekisteritiedot xmlns:ns1="http://docs.koski-xroad.fi/producer">
          <ns1:hetu xmlns:ns1="http://docs.koski-xroad.fi/producer">210281-9988</ns1:hetu>
          <!-- <ns1:hetu>210281-9988</ns1:hetu> -->
          </ns1:suomiFiRekisteritiedot>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
`

const exampleSoapRequest2 = `
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Header>
      <xrd:client xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SUBSYSTEM">
          <id:xRoadInstance>FI-TEST</id:xRoadInstance>
          <id:memberClass>GOV</id:memberClass>
          <id:memberCode>0245437-2</id:memberCode>
          <id:subsystemCode>ServiceViewClient</id:subsystemCode>
      </xrd:client>
      <xrd:service xmlns:xrd="http://x-road.eu/xsd/xroad.xsd" xmlns:id="http://x-road.eu/xsd/identifiers" id:objectType="SERVICE">
          <id:xRoadInstance>FI-TEST</id:xRoadInstance>
          <id:memberClass>GOV</id:memberClass>
          <id:memberCode>2769790-1</id:memberCode>
          <id:subsystemCode>koski</id:subsystemCode>
          <id:serviceCode>suomiFiRekisteritiedot</id:serviceCode>
          <id:serviceVersion>v1</id:serviceVersion>
      </xrd:service>
      <xrd:protocolVersion xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">4.0</xrd:protocolVersion>
      <xrd:userId xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">jdoe</xrd:userId>
      <xrd:id xmlns:xrd="http://x-road.eu/xsd/xroad.xsd">38997cf6400edd85</xrd:id>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
      <ns1:suomiFiRekisteritiedot xmlns:ns1="http://docs.koski-xroad.fi/producer">
          <ns1:hetu xmlns:ns1="http://docs.koski-xroad.fi/producer">210281-9988</ns1:hetu>
          <!-- <ns1:hetu>210281-9988</ns1:hetu> -->
          </ns1:suomiFiRekisteritiedot>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
`

const getLatestLogEntry = () => new Promise((resolve, reject) => {
  let stdout = ''
  const logs = spawn('docker', ['logs', 'koski-luovutuspalvelu-proxy'])
  logs.stdout.on('data', (data) => {
    stdout = data.toString()
  })
  logs.on('exit', (code) => {
    if (code === 0) {
      try {
        const lines = stdout.split('\n').filter(n => n.length > 0)
        const lastLine = lines[lines.length - 1]
        resolve(JSON.parse(lastLine))
      } catch (e) {
        reject('Invalid log entry')
      }
    } else {
      reject(`Exit code ${code}`)
    }
  })
})

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
      expect(bodyJson).to.deep.equal([{"key": "unauthorized.sslCertificateError", "message": "FAILED:self-signed certificate"}])
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

    it('proxying works if xroadSecurityServer flag is set, with SOAP request 1', async () => {
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

    it('proxying works if xroadSecurityServer flag is set, with SOAP request 2', async () => {
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomething', {method: 'POST', body: exampleSoapRequest2, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('koskiMock.url', '/koski/api/palveluvayla/soapSomething')
      expect(bodyJson).to.have.nested.property(
        'koskiMock.headers.authorization',
        'Basic ' + Buffer.from('clientuser5:dummy321').toString('base64')
      )
    })

    it('requires known xroad client, with SOAP request 1', async () => {
      const requestBody = exampleSoapRequest.replace('ServiceViewClient', 'UnknownClient')
      const res = await gotWithClientCert4('koski/api/palveluvayla/soapSomething', {method: 'POST', body: requestBody, headers: {'Content-Type': 'text/xml'}})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownXroadClient')
      const bodyJson = JSON.parse(res.body)
      expect(bodyJson).to.have.nested.property('0.key', 'unauthorized.unknownXroadClient')
    })

    it('requires known xroad client, with SOAP request 2', async () => {
      const requestBody = exampleSoapRequest2.replace('ServiceViewClient', 'UnknownClient')
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

  describe("/koski/api/omadata-oauth2/authorization-server", () => {
    it("proxies API calls to Koski", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.url",
            "/koski/api/omadata-oauth2/authorization-server"
        )
    })

    it("adds basic authentication to request", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.headers.authorization",
            "Basic " + Buffer.from("clientuser:dummy123").toString("base64")
        )
    })

    it("Does not add original Authorization header as X-Auth header ", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            {
                json: true,
                headers: {
                    Authorization: "Bearer foobar",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).to.not.have.property("x-auth")
    })

    it("replaces X-Forwarded-For/X-Forwarded-Proto headers", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            {
                json: true,
                headers: {
                    "X-Forwarded-For": "192.168.1.1",
                    "X-Forwarded-Proto": "smtp",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).to.have.property("x-forwarded-for")
        expect(headers["x-forwarded-for"]).to.not.include("192.168.1.1")
        expect(headers).to.have.property("x-forwarded-proto", "https")
    })

    it("removes Forwarded and Cookie headers (might confuse Koski backend)", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            {
                json: true,
                headers: {
                    Forwarded: "for=192.168.1.1",
                    Cookie: "test=1",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).not.to.have.property("forwarded")
        expect(headers).not.to.have.property("cookie")
    })

    it("adds Caller-Id header", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.headers.caller-id",
            "1.2.246.562.10.00000000001.koski-luovutuspalvelu-proxy"
        )
    })

    it("proxies 403 status code from Koski", async () => {
        // TODO
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server/unauthorized",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
    })

    it("proxies 404 status code from Koski", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/authorization-server/notfound",
            { json: true }
        )
        expect(res.statusCode).to.equal(404)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
    })

    it("requires SSL client certificate", async () => {
        const res = await gotWithoutClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.clientCertificateRequired"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.clientCertificateRequired",
                message: "Varmenne puuttuu",
            },
        ])
    })

    it("requires known SSL client certificate", async () => {
        const res = await gotWithClientCert2(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.unknownClientCertificate"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.unknownClientCertificate",
                message: "Tuntematon varmenne: CN=client2.example.com,O=Testi,C=FI",
            },
        ])
    })

    it("does not accept self-signed SSL client certificate", async () => {
        const res = await gotWithSelfSignedClientCert(
            "koski/api/omadata-oauth2/authorization-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(400)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.sslCertificateError"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.sslCertificateError",
                message: "FAILED:self-signed certificate",
            },
        ])
    })

    it("does not accept connections from unknown IP address", async () => {
        const res = await gotWithClientCert3(
            "koski/api/omadata-oauth2/authorization-server/ip",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.unknownIpAddress"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "0.key",
            "unauthorized.unknownIpAddress"
        )
    })

    it("returns graceful error when password is missing from config", async () => {
        const res = await gotWithClientCert5(
            "koski/api/omadata-oauth2/authorization-server/missing",
            { json: true }
        )
        expect(res.statusCode).to.equal(500)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=internalError.missingPassword"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "0.key",
            "internalError.missingPassword"
        )
    })
  })

  describe("/koski/api/omadata-oauth2/resource-server", () => {
    it("proxies API calls to Koski", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.url",
            "/koski/api/omadata-oauth2/resource-server"
        )
    })

    it("adds basic authentication to request", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.headers.authorization",
            "Basic " + Buffer.from("clientuser:dummy123").toString("base64")
        )
    })

    it("Adds original Authorization header as X-Auth header ", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            {
                json: true,
                headers: {
                    Authorization: "Bearer foobar",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).to.have.property("x-auth", "Bearer foobar")
    })

    it("replaces X-Forwarded-For/X-Forwarded-Proto headers", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            {
                json: true,
                headers: {
                    "X-Forwarded-For": "192.168.1.1",
                    "X-Forwarded-Proto": "smtp",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).to.have.property("x-forwarded-for")
        expect(headers["x-forwarded-for"]).to.not.include("192.168.1.1")
        expect(headers).to.have.property("x-forwarded-proto", "https")
    })

    it("removes Forwarded and Cookie headers (might confuse Koski backend)", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            {
                json: true,
                headers: {
                    Forwarded: "for=192.168.1.1",
                    Cookie: "test=1",
                },
            }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property("koskiMock.headers")
        const headers = bodyJson.koskiMock.headers
        expect(headers).not.to.have.property("forwarded")
        expect(headers).not.to.have.property("cookie")
    })

    it("adds Caller-Id header", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(200)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "koskiMock.headers.caller-id",
            "1.2.246.562.10.00000000001.koski-luovutuspalvelu-proxy"
        )
    })

    it("proxies 403 status code from Koski", async () => {
        // TODO
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server/unauthorized",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
    })

    it("proxies 404 status code from Koski", async () => {
        const res = await gotWithClientCert(
            "koski/api/omadata-oauth2/resource-server/notfound",
            { json: true }
        )
        expect(res.statusCode).to.equal(404)
        expect(res.headers).to.have.property("x-log", "proxyResponse=proxied")
    })

    it("requires SSL client certificate", async () => {
        const res = await gotWithoutClientCert(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.clientCertificateRequired"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.clientCertificateRequired",
                message: "Varmenne puuttuu",
            },
        ])
    })

    it("requires known SSL client certificate", async () => {
        const res = await gotWithClientCert2(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.unknownClientCertificate"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.unknownClientCertificate",
                message: "Tuntematon varmenne: CN=client2.example.com,O=Testi,C=FI",
            },
        ])
    })

    it("does not accept self-signed SSL client certificate", async () => {
        const res = await gotWithSelfSignedClientCert(
            "koski/api/omadata-oauth2/resource-server",
            { json: true }
        )
        expect(res.statusCode).to.equal(400)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.sslCertificateError"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.deep.equal([
            {
                key: "unauthorized.sslCertificateError",
                message: "FAILED:self-signed certificate",
            },
        ])
    })

    it("does not accept connections from unknown IP address", async () => {
        const res = await gotWithClientCert3(
            "koski/api/omadata-oauth2/resource-server/ip",
            { json: true }
        )
        expect(res.statusCode).to.equal(403)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=unauthorized.unknownIpAddress"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "0.key",
            "unauthorized.unknownIpAddress"
        )
    })

    it("returns graceful error when password is missing from config", async () => {
        const res = await gotWithClientCert5(
            "koski/api/omadata-oauth2/resource-server/missing",
            { json: true }
        )
        expect(res.statusCode).to.equal(500)
        expect(res.headers).to.have.property(
            "x-log",
            "proxyResponse=internalError.missingPassword"
        )
        const bodyJson = JSON.parse(res.body)
        expect(bodyJson).to.have.nested.property(
            "0.key",
            "internalError.missingPassword"
        )
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
    it('masks sensitive information in access log (1)', async () => {
      await gotWithClientCert('koski/api/luovutuspalvelu/sensitive/110205A9654', {json: true})
      const log = await getLatestLogEntry()
      expect(log.requestUri).to.equal('/koski/api/luovutuspalvelu/sensitive/***********')
    })
    it('masks sensitive information in access log (2)', async () => {
      await gotWithClientCert('koski/api/luovutuspalvelu/sensitive/240896V670A', {json: true})
      const log = await getLatestLogEntry()
      expect(log.requestUri).to.equal('/koski/api/luovutuspalvelu/sensitive/***********')
    })
    it('masks sensitive information in access log (3)', async () => {
      await gotWithClientCert('koski/api/luovutuspalvelu/sensitive/020996X347H', {json: true})
      const log = await getLatestLogEntry()
      expect(log.requestUri).to.equal('/koski/api/luovutuspalvelu/sensitive/***********')
    })
  })

})
