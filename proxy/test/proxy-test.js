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

const gotWithSelfSignedClientCert = gotWithoutClientCert.extend({
  key: fs.readFileSync(__dirname + '/testca/private/selfsigned.key'),
  cert: fs.readFileSync(__dirname + '/testca/certs/selfsigned.crt'),
})

describe('koski-luovutuspalvelu proxy', () => {

  describe('/koski-luovutuspalvelu/healthcheck', () => {

    it('responds to proxy health check', async () => {
      const res = await gotWithoutClientCert('/koski-luovutuspalvelu/healthcheck/proxy')
      expect(res.statusCode).to.equal(200)
    })

  })

  describe('/koski-luovutuspalvelu/buildversion.txt', () => {

    it('returns build version', async () => {
      const res = await gotWithoutClientCert('/koski-luovutuspalvelu/buildversion.txt')
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.include('vcsRevision=')
    })

  })

  describe('/koski/api/luovutuspalvelu', () => {

    it('proxies API calls to Koski', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.body).to.have.nested.property('koskiMock.url', '/koski/api/luovutuspalvelu/hetu')
    })

    it('adds basic authentication to request', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {json: true})
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.have.nested.property(
        'koskiMock.headers.authorization',
        'Basic ' + Buffer.from('clientUser:dummy123').toString('base64')
      )
    })

    it('replaces Forwarded/X-Forwarded-For/X-Forwarded-Proto headers', async () => {
      const res = await gotWithClientCert('/koski/api/luovutuspalvelu/hetu', {
        json: true,
        headers: {
          'Forwarded': 'for=192.168.1.1',
          'X-Forwarded-For': '192.168.1.1',
          'X-Forwarded-Proto': 'smtp'
        }
      })
      expect(res.statusCode).to.equal(200)
      expect(res.body).to.have.nested.property('koskiMock.headers')
      const headers = res.body.koskiMock.headers
      expect(headers).to.have.property('forwarded')
      expect(headers['forwarded']).to.not.include('192.168.1.1')
      expect(headers).to.have.property('x-forwarded-for')
      expect(headers['x-forwarded-for']).to.not.include('192.168.1.1')
      expect(headers).to.have.property('x-forwarded-proto', 'https')
    })

    it('requires SSL client certificate', async () => {
      const res = await gotWithoutClientCert('/koski/api/luovutuspalvelu/hetu')
      expect(res.statusCode).to.equal(403)
      expect(res.body).to.equal('client certificate required')
    })

    it('requires known SSL client certificate', async () => {
      const res = await gotWithClientCert2('/koski/api/luovutuspalvelu/hetu')
      expect(res.statusCode).to.equal(403)
      expect(res.body).to.equal('unknown client certificate: CN=client2.example.com,O=Testi,C=FI')
    })

    it('does not accept self-signed SSL client certificate', async () => {
      const res = await gotWithSelfSignedClientCert('/koski/api/luovutuspalvelu/self')
      expect(res.statusCode).to.equal(400)
      expect(res.body).to.equal('ssl certificate error: FAILED:unable to verify the first certificate')
    })

  })

  describe('other URLs', () => {
    it('/ returns 404 foo', async () => {
      const res = await gotWithoutClientCert('/')
      expect(res.statusCode).to.equal(404)
    })
    it('/koski/api/koodisto/opiskeluoikeudentyyppi/latest returns 404', async () => {
      const res = await gotWithoutClientCert('/koski/api/koodisto/opiskeluoikeudentyyppi/latest')
      expect(res.statusCode).to.equal(404)
    })
  })

})