/* eslint-disable security/detect-non-literal-fs-filename */
const mockRandomString = {
  generate: jest.fn(() => ('randomString')),
};
jest.mock('randomstring', () => mockRandomString);

const fs = require('fs');
const path = require('path');
const {
  replaceTLSFlattenConfigs,
  generatePKCEChallenge,
} = require('../../app/Utils');

describe('Utils', () => {
  beforeAll(() => {
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('replaceTLSFlattenConfigs with .tls', () => {
    const x = replaceTLSFlattenConfigs({
      name: 'a',
      port: 5432,
      'name.tls': 'b',
      'tls.ca': path.join(__dirname, 'certs/ca.pem'),
      'tls.cert': path.join(__dirname, 'certs/cert.pem'),
      'tls.key': path.join(__dirname, 'certs/key.pem'),
      'tls.request.cert': 'true',
      'tls.reject.unauthorized': true,
    });

    expect(x).toStrictEqual({
      name: 'a',
      port: 5432,
      'name.tls': 'b',
      tls: {
        ca: fs.readFileSync(path.join(__dirname, 'certs/ca.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
        key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
        requestCert: true,
        rejectUnauthorized: true,
      },
    });
  });

  test('replaceTLSFlattenConfigs without .tls or .ssl', () => {
    const configSame = {
      name: 'b',
      port: 5432,
      'name.tls': 'c',
      'name.tls.x': 'c',
    };
    const x = replaceTLSFlattenConfigs(configSame);

    expect(x).toStrictEqual(configSame);
  });

  test('replaceTLSFlattenConfigs with .ssl', () => {
    const x = replaceTLSFlattenConfigs({
      name: 'a',
      port: 5432,
      'name.name': 'b',
      'ssl.ca': path.join(__dirname, 'certs/ca.pem'),
      'ssl.cert': path.join(__dirname, 'certs/cert.pem'),
      'ssl.key': path.join(__dirname, 'certs/key.pem'),
      'ssl.request.cert': false,
      'ssl.reject.unauthorized': 'false',
    });

    expect(x).toStrictEqual({
      name: 'a',
      port: 5432,
      'name.name': 'b',
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'certs/ca.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
        key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
        requestCert: false,
        rejectUnauthorized: false,
      },
    });
  });

  test('generatePKCEChallenge', () => {
    expect(generatePKCEChallenge()).toStrictEqual({
      codeChallenge: 'y7SmQAY3jsJhhA05q2zHYEjz2tFuGbfbUI-xG6RZTFE',
      codeVerifier: 'randomString',
    });
  });
});
