'use strict';


/* dependencies */
const { readFileSync } = require('fs');
const _ = require('lodash');
const moment = require('moment');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const {
  WEBHOOK_PATH,
  country,
  provider,
  method,
  channel,
  mode,
  currency,
  name,
  serialize,
  serializeLogin,
  serializeTransaction,
  deserialize,
  deserializeLogin,
  deserializeTransaction,
  deserializeResult,
  readSSLOptions
} = include(__dirname, '..');


/* helpers */
const readFile = path => {
  const FIXTURES_PATH = `${__dirname}/fixtures`;
  return readFileSync(`${FIXTURES_PATH}/${path}`, 'UTF-8');
};


describe('tz mpesa ussd push', () => {
  const BASE_URL = 'https://ussd.vodacom.io';
  const LOGIN_PATH = '/transactions';
  const REQUEST_PATH = '/transactions';
  const USERNAME = '123000';
  const PASSWORD = '123@123';
  const BUSINESS_NAME = 'MPESA';
  const BUSINESS_NUMBER = '338899';
  const CA_FILE_PATH = `${__dirname}/fixtures/ssl/root.pem`;
  const CERT_FILE_PATH = `${__dirname}/fixtures/ssl/test.crt`;
  const KEY_FILE_PATH = `${__dirname}/fixtures/ssl/test.key`;

  before(() => {
    process.env.TZ_MPESA_USSD_PUSH_BASE_URL = BASE_URL;
    process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH = LOGIN_PATH;
    process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH = REQUEST_PATH;
    process.env.TZ_MPESA_USSD_PUSH_USERNAME = USERNAME;
    process.env.TZ_MPESA_USSD_PUSH_PASSWORD = PASSWORD;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME = BUSINESS_NAME;
    process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER = BUSINESS_NUMBER;
    process.env.TZ_MPESA_USSD_SSL_CA_FILE_PATH = CA_FILE_PATH;
    process.env.TZ_MPESA_USSD_SSL_CERT_FILE_PATH = CERT_FILE_PATH;
    process.env.TZ_MPESA_USSD_SSL_KEY_FILE_PATH = KEY_FILE_PATH;
  });

  it('should be from tz', () => {
    expect(country).to.exist;
    expect(country).to.be.equal('TZ');
  });

  it('should be from Vodacom', () => {
    expect(provider).to.exist;
    expect(provider).to.be.equal('Vodacom');
  });

  it('should be a mobile money method', () => {
    expect(method).to.exist;
    expect(method).to.be.equal('Mobile Money');
  });

  it('should be an mpesa channel', () => {
    expect(channel).to.exist;
    expect(channel).to.be.equal('MPESA');
  });

  it('should use ussd push mode', () => {
    expect(mode).to.exist;
    expect(mode).to.be.equal('USSD Push');
  });

  it('should use tzs currency', () => {
    expect(currency).to.exist;
    expect(currency).to.be.equal('TZS');
  });

  it('should expose machine readable name', () => {
    expect(name).to.exist;
    expect(name).to.be.equal('tz-mpesa-ussd-push');
  });

  it('should expose webhook path', () => {
    expect(WEBHOOK_PATH).to.exist;
    expect(WEBHOOK_PATH).to.be.equal('/webhooks/tz/mpesa/ussd-push');
  });

  it('should serialize json to xml', done => {
    const xml = readFile('generic_request.xml');
    const payload = {
      header: { eventId: 2500, token: '96feae744a986aeee4433' },
      request: { username: '123000', password: '123@123' }
    };
    serialize(payload, (error, request) => {
      expect(error).to.not.exist;
      expect(request).to.exist;
      expect(_.kebabCase(request)).to.be.equal(_.kebabCase(xml));
      done(error, request);
    });
  });

  it('should build login request', done => {
    const xml = readFile('login_request.xml');
    const payload = { username: '123000', password: '123@123' };
    serializeLogin(payload, (error, request) => {
      expect(error).to.not.exist;
      expect(request).to.exist;
      expect(_.kebabCase(request)).to.be.equal(_.kebabCase(xml));
      done(error, request);
    });
  });

  it('should build transaction request', done => {
    const xml = readFile('transaction_request.xml');
    const payload = {
      username: '123000',
      sessionId: '744a986aeee4433fdf1b2',
      msisdn: '255754001001',
      businessName: 'MPESA',
      businessNumber: '338899',
      date: moment('2019020804', 'YYYYMMDDHH').toDate(),
      amount: 1500,
      reference: 'A5FK3170',
      callbackUrl: 'https://api.example.com/webhooks/payments'
    };
    serializeTransaction(payload, (error, request) => {
      expect(error).to.not.exist;
      expect(request).to.exist;
      expect(_.kebabCase(request)).to.be.equal(_.kebabCase(xml));
      done(error, request);
    });
  });

  it('should deserialize xml to json', done => {
    const xml = readFile('generic_request.xml');
    deserialize(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, request } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(request).to.exist;
      expect(request).to.be.an('object');
      done(error, payload);
    });
  });

  it('should deserialize authentication failed to error', done => {
    const xml = readFile('authentication_failed_response.xml');
    deserialize(xml, (error, payload) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Authentication Failed');
      expect(error.status).to.be.equal(401);
      expect(payload).to.not.exist;
      done(null, payload);
    });
  });

  it('should deserialize session expired to error', done => {
    const xml = readFile('session_expired_response.xml');
    deserialize(xml, (error, payload) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Session Expired');
      expect(error.status).to.be.equal(401);
      expect(payload).to.not.exist;
      done(null, payload);
    });
  });

  it('should deserialize login failed to error', done => {
    const xml = readFile('login_failed_response.xml');
    deserialize(xml, (error, payload) => {
      expect(error).to.exist;
      expect(error.message).to.be.equal('Invalid Credentials');
      expect(error.status).to.be.equal(401);
      expect(payload).to.not.exist;
      done(null, payload);
    });
  });

  it('should deserialize login response to json', done => {
    const xml = readFile('login_response.xml');
    deserializeLogin(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, event, request, response } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(event).to.exist;
      expect(event).to.be.an('object');
      expect(request).to.exist;
      expect(request).to.be.an('object');
      expect(response).to.exist;
      expect(response).to.be.an('object');
      expect(payload).to.be.eql({
        header: { eventId: 2500 },
        event: {
          code: 3,
          description: 'Processed',
          detail: 'Processed',
          transactionId: '504830a4f038cb842960cc'
        },
        request: { username: 123000, password: '123@123' },
        response: { sessionId: '744a986aeee4433fdf1b2' }
      });
      done(error, payload);
    });
  });

  it('should deserialize transaction response to json', done => {
    const xml = readFile('transaction_response.xml');
    deserializeTransaction(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, event, request, response } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(event).to.exist;
      expect(event).to.be.an('object');
      expect(request).to.exist;
      expect(request).to.be.an('object');
      expect(response).to.exist;
      expect(response).to.be.an('object');
      expect(payload).to.be.eql({
        header: { eventId: 40009 },
        event: {
          code: 3,
          description: 'Processed',
          detail: 'Processed',
          transactionId: 'e4245ff7a2154b59a2a5e778c2806712'
        },
        request: {
          customerMsisdn: 255754001001,
          businessName: 'MPESA',
          businessNumber: 338899,
          currency: 'TZS',
          date: moment('2019020804', 'YYYYMMDDHH').toDate(),
          amount: 1500,
          thirdPartyReference: 'A5FK3170',
          command: 'CustomerPaybill',
          callBackChannel: 1,
          callbackDestination: 'https://api.example.com/webhooks/payments',
          username: 123000
        },
        response: {
          thirdPartyReference: 'A5FK3170',
          insightReference: '580FBEBAF2F9FF43E0540208206B0EEF',
          responseCode: 0
        }
      });
      done(error, payload);
    });
  });

  it('should deserialize transaction result to json', done => {
    const xml = readFile('transaction_result.xml');
    deserializeResult(xml, (error, payload) => {
      expect(error).to.not.exist;
      expect(payload).to.exist;
      const { header, request } = payload;
      expect(header).to.exist;
      expect(header).to.be.an('object');
      expect(header).to.be.eql({ eventId: 1 });
      expect(request).to.exist;
      expect(request).to.be.an('object');
      expect(payload).to.be.eql({
        header: { eventId: 1 },
        event: {},
        request: {
          resultType: undefined,
          resultCode: undefined,
          resultDesc: undefined,
          transactionStatus: 'USSDCallbackCancel',
          originatorConversationId: undefined,
          conversationId: undefined,
          transId: undefined,
          businessNumber: 888888,
          currency: 'TZS',
          amount: 1500,
          date: moment('20190208 190147', 'YYYYMMDD HHmmss').toDate(),
          thirdPartyReference: 'E5FK3170',
          insightReference: '580FBEBAF2F9FF43E0540208206B0EEF'
        },
        response: {}
      });
      done(error, payload);
    });
  });

  it('should be able to obtain default ssl options', () => {
    const sslOptions = readSSLOptions();
    expect(sslOptions).to.exist;
    expect(sslOptions.ca).to.exist;
    expect(sslOptions.cert).to.exist;
    expect(sslOptions.key).to.exist;
  });

  it('should be able to obtain ssl options of provided options', () => {
    const sslOptions = readSSLOptions({
      sslCaFilePath: CA_FILE_PATH,
      sslCertFilePath: CERT_FILE_PATH,
      sslKeyFilePath: KEY_FILE_PATH,
      sslPassphrase: '1234567890'
    });
    expect(sslOptions).to.exist;
    expect(sslOptions.ca).to.exist;
    expect(sslOptions.cert).to.exist;
    expect(sslOptions.key).to.exist;
    expect(sslOptions.passphrase).to.be.equal('1234567890');
  });

  after(() => {
    delete process.env.TZ_MPESA_USSD_PUSH_BASE_URL;
    delete process.env.TZ_MPESA_USSD_PUSH_LOGIN_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_REQUEST_PATH;
    delete process.env.TZ_MPESA_USSD_PUSH_USERNAME;
    delete process.env.TZ_MPESA_USSD_PUSH_PASSWORD;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NAME;
    delete process.env.TZ_MPESA_USSD_PUSH_BUSINESS_NUMBER;
    delete process.env.TZ_MPESA_USSD_SSL_CA_FILE_PATH;
    delete process.env.TZ_MPESA_USSD_SSL_CERT_FILE_PATH;
    delete process.env.TZ_MPESA_USSD_SSL_KEY_FILE_PATH;
  });

});
