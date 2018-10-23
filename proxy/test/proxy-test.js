const gotModule = require('got')
const chai = require('chai')
const express = require('express')
const fs = require('fs')
const https = require('https')

const expect = require('chai').expect

const proxyPort = 7022
const koskiMockPort = 7023

const koskiMockApp = express()
koskiMockApp.get('/*', (req, res) => {
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
  baseUrl,
  throwHttpErrors: false,
  followRedirect: false,
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

const gotWithSelfSignedClientCert = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/selfsigned.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/selfsigned.crt'),
})

describe('koski-luovutuspalvelu proxy', () => {

  describe('/koski-luovutuspalvelu/healthcheck', () => {

    it('responds to proxy health check', async () => {
      const res = await gotWithoutClientCert('/koski-luovutuspalvelu/healthcheck/proxy')
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.statusCode).to.equal(200)
    })

  })

  describe('/koski-luovutuspalvelu/buildversion.txt', () => {

    it('returns build version', async () => {
      const res = await gotWithoutClientCert('/koski-luovutuspalvelu/buildversion.txt')
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.body).to.include('vcsRevision=')
    })

  })

  describe('/robots.txt', () => {

    it('disallows everything', async () => {
      const res = await gotWithoutClientCert('/robots.txt')
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=ok')
      expect(res.headers).to.have.property('content-type', 'text/plain')
      expect(res.body).to.equal('User-Agent: *\nDisallow: /\n')
    })

  })

  describe('/koski/api/luovutuspalvelu', () => {

    it('proxies API calls to Koski', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      expect(res.body).to.have.nested.property('koskiMock.url', '/koski/api/luovutuspalvelu/hetu')
    })

    it('adds basic authentication to request', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      expect(res.body).to.have.nested.property(
        'koskiMock.headers.authorization',
        'Basic ' + Buffer.from('clientUser:dummy123').toString('base64')
      )
    })

    it('replaces X-Forwarded-For/X-Forwarded-Proto headers', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {
        json: true,
        headers: {
          'X-Forwarded-For': '192.168.1.1',
          'X-Forwarded-Proto': 'smtp'
        }
      })
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      expect(res.body).to.have.nested.property('koskiMock.headers')
      const headers = res.body.koskiMock.headers
      expect(headers).to.have.property('x-forwarded-for')
      expect(headers['x-forwarded-for']).to.not.include('192.168.1.1')
      expect(headers).to.have.property('x-forwarded-proto', 'https')

    })

    it('removes Forwarded and Cookie headers (might confuse Koski backend)', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {
        json: true,
        headers: {
          'Forwarded': 'for=192.168.1.1',
          'Cookie': 'test=1',
        }
      })
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      expect(res.body).to.have.nested.property('koskiMock.headers')
      const headers = res.body.koskiMock.headers
      expect(headers).not.to.have.property('forwarded')
      expect(headers).not.to.have.property('cookie')
    })

    it('adds Caller-Id header', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(200)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
      expect(res.body).to.have.nested.property(
        'koskiMock.headers.caller-id',
        '1.2.246.562.10.00000000001.koski-luovutuspalvelu-proxy'
      )
    })

    it('proxies 403 status code from Koski', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/unauthorized', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
    })

    it('proxies 404 status code from Koski', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/notfound', {json: true})
      expect(res.statusCode).to.equal(404)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=proxied')
    })

    it('requires SSL client certificate', async () => {
      const res = await gotWithoutClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.clientCertificateRequired')
      expect(res.body).to.deep.equal([{"key": "unauthorized.clientCertificateRequired", "message": "Varmenne puuttuu"}])
    })

    it('requires known SSL client certificate', async () => {
      const res = await gotWithClientCert2('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownClientCertificate')
      expect(res.body).to.deep.equal([{"key": "unauthorized.unknownClientCertificate", "message": "Tuntematon varmenne: CN=client2.example.com,O=Testi,C=FI"}])
    })

    it('does not accept self-signed SSL client certificate', async () => {
      const res = await gotWithSelfSignedClientCert('/koski/api/luovutuspalvelu/self', {json: true})
      expect(res.statusCode).to.equal(400)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.sslCertificateError')
      expect(res.body).to.deep.equal([{"key": "unauthorized.sslCertificateError", "message": "FAILED:unable to verify the first certificate"}])
    })

    it('does not accept connections from unknown IP address', async () => {
      const res = await gotWithClientCert3('/koski/api/luovutuspalvelu/ip', {json: true})
      expect(res.statusCode).to.equal(403)
      expect(res.headers).to.have.property('x-log', 'proxyResponse=unauthorized.unknownIpAddress')
      expect(res.body).to.have.nested.property('0.key', 'unauthorized.unknownIpAddress')
    })

  })

  describe('other URLs', () => {
    it('/ returns 404 foo', async () => {
      const res = await gotWithoutClientCert('/')
      expect(res.headers).to.have.property('x-log', 'proxyResponse=notFound')
      expect(res.statusCode).to.equal(404)
    })
    it('/koski/api/koodisto/opiskeluoikeudentyyppi/latest returns 404', async () => {
      const res = await gotWithoutClientCert('/koski/api/koodisto/opiskeluoikeudentyyppi/latest')
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
