const mockConfig = {
  express: { trustproxy: true },
  graphql: {
    graphiql: false,
  },
  session: {
    secret: 'aabcdeddd',
    cookieName: 'dojot-backstage-cookie',
    cookieHTTPS: false,
    cookiePath: '/',
    proxy: true,
    domain: 'localhost',
    'redis.max.life.time.sec': 86400,
    'redis.max.idle.time.sec': 1800,
  },
  app: {
    'base.url': 'http://localhost:8000',
    'internal.base.url': 'http://apigw:8000',
  },
  gui: {
    'return.url': 'http://localhost:8000/return',
    'home.url': 'http://localhost:8000',
  },
  proxy: {
    target: 'http://127.0.0.1:34059',
    'log.level': 'debug',
    'log.secure': false,
  },
};

const { WebUtils } = jest.requireActual('@dojot/microservice-sdk');

const mockSdk = {
  ConfigManager: {
    getConfig: jest.fn(() => mockConfig),
    transformObjectKeys: jest.fn((obj) => obj),
  },
  Logger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
  WebUtils,
};
jest.mock('@dojot/microservice-sdk', () => mockSdk);

const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDestroy = jest.fn();
const mockRedisRestartIdleTTL = jest.fn().mockResolvedValue('Ok');
const mockRedis = {
  initialized: true,
  getManagementInstance: jest.fn(() => ({
    setFuncToCallBeforeDestroy: jest.fn(),
    set: mockRedisSet,
    get: mockRedisGet,
    restartIdleTTL: mockRedisRestartIdleTTL,
    destroy: mockRedisDestroy,
  })),
};

const mockKeycloakLogout = jest.fn();
const mockKeyInfoByToken = jest.fn();
const mockTokenByRefresh = jest.fn();
const urlLoginBuild = 'http://buildUrlLogin:8000';
const mockBuildUrlLogin = jest.fn().mockReturnValueOnce(urlLoginBuild);
const mockTokenByAuthCode = jest.fn();
const mockKey = {
  initialized: true,
  getRequestsInstance: jest.fn(() => ({
    logout: mockKeycloakLogout,
    getTokenByAuthorizationCode: mockTokenByAuthCode,
    getPermissionsByToken: jest.fn().mockResolvedValue({
      resourceName: 'x',
      scopes: ['view', 'delete'],
    }),
    getUserInfoByToken: mockKeyInfoByToken,
    getTokenByRefreshToken: mockTokenByRefresh,
  })),
  buildUrlLogin: mockBuildUrlLogin,
  buildUrlLogout: jest.fn(() => ('http://buildUrlLogout:8000')),
};

const request = require('supertest');


const express = require('../../../app/express');

const mockSignalReady = jest.fn();
const mockNotSignalReady = jest.fn();
const mockRegisterShutdownHandler = jest.fn();
const mockShutdown = jest.fn();
const serviceStateMock = {
  signalReady: mockSignalReady,
  signalNotReady: mockNotSignalReady,
  registerShutdownHandler: mockRegisterShutdownHandler,
  shutdown: mockShutdown,
  isServerShuttingDown: jest.fn(),
  isReady: jest.fn(() => (true)),
  createBeacon: jest.fn(() => ({
    die: () => jest.fn(),
  })),
};

const app = express(
  serviceStateMock,
  '/backstage/v1',
  {
    redis: mockRedis,
    keycloak: mockKey,
  },
);

const sessionBaseObj = {
  cookie: {
    originalMaxAge: null,
    expires: null,
    secure: false,
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
  },
};

const sessionMockIncomplete = {
  ...sessionBaseObj,
  realm: 'realm',
  codeVerifier: 'codeVerifier',
};

const sessionMockComplete = {
  ...sessionMockIncomplete,
  accessToken: 'accessToken',
  accessTokenExpiresAt: 'accessTokenExpiresAt',
  refreshToken: 'refreshToken',
};


const sessionMockExpiredToken = {
  ...sessionMockComplete,
  accessTokenExpiresAt: new Date(2020, 11, 17),
};

const userInfo = {
  name: 'Name',
  username: 'username',
  email: 'email',
  emailVerified: true,
  realm: 'realm',
  tenant: 'realm',
};

const api = request(app);

describe('RoutesV1', () => {
  let cookies;

  test('/backstage/v1/auth: ok', (done) => {
    api
      .get('/backstage/v1/auth?tenant=admin')
      .then((res) => {
        expect(res.statusCode).toBe(303);
        expect(res.redirect).toBe(true);
        // eslint-disable-next-line prefer-destructuring
        cookies = res.headers['set-cookie'].pop().split(';')[0];
        expect(res.header.location).toBe('http://buildUrlLogin:8000');
        done();
      });
  });

  test('/backstage/v1/auth: without query string', (done) => {
    api
      .get('/backstage/v1/auth')
      .then((res) => {
        expect(res.statusCode).toBe(400);
        expect(res.body).toStrictEqual({ error: "request.query should have required property 'tenant'" });
        done();
      });
  });

  test('/backstage/v1/auth: unexpected error', (done) => {
    mockBuildUrlLogin.mockImplementationOnce(new Error());
    api
      .get('/backstage/v1/auth?tenant=admin')
      .then((res) => {
        expect(res.statusCode).toBe(500);
        expect(res.body).toStrictEqual({ error: 'An unexpected error has occurred.' });
        done();
      });
  });

  test('/backstage/v1/auth: error when try set session', (done) => {
    mockRedisSet.mockRejectedValueOnce(new Error());
    mockBuildUrlLogin.mockImplementationOnce(new Error());
    api
      .get('/backstage/v1/auth?tenant=admin')
      .then((res) => {
        expect(res.statusCode).toBe(500);
        expect(res.body).toStrictEqual({ error: 'An unexpected error has occurred.' });
        done();
      });
  });

  test('/backstage/v1/auth/return: ok', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockIncomplete);
    mockTokenByAuthCode.mockResolvedValue({
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
      refreshExpiresAt: 'refreshExpiresAt',
      accessTokenExpiresAt: 'accessTokenExpiresAt',
    });
    api
      .get('/backstage/v1/auth/return?code=code&state=state&session_state=session_state')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://localhost:8000/return?state=state');
        done();
      });
  });

  test('/backstage/v1/auth/return: error when try get session', (done) => {
    mockRedisGet.mockRejectedValueOnce(new Error());
    api
      .get('/backstage/v1/auth/return?code=code&state=state&session_state=session_state')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(response.body).toStrictEqual({ error: 'An unexpected error has occurred.' });
        done();
      });
  });

  test('/backstage/v1/auth/return: redirect with error', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockIncomplete);
    mockTokenByAuthCode.mockRejectedValueOnce(new Error('msgError'));
    api
      .get('/backstage/v1/auth/return?code=code&state=state&session_state=session_state')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://localhost:8000/return?error=msgError');
        done();
      });
  });

  test('/backstage/v1/auth/return: without call /auth ', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionBaseObj);
    api
      .get('/backstage/v1/auth/return?code=code&state=state&session_state=session_state')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://localhost:8000/return?error=There+is+no+active+session');
        done();
      });
  });

  test('/backstage/v1/auth/return: without query string ', (done) => {
    api
      .get('/backstage/v1/auth/return')
      .then((response) => {
        expect(response.statusCode).toBe(400);
        expect(response.body).toStrictEqual({ error: "request.query should have required property 'code', request.query should have required property 'state'" });
        done();
      });
  });

  test('/backstage/v1/auth/user-info: ok', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    mockKeyInfoByToken.mockResolvedValueOnce(userInfo);

    api
      .get('/backstage/v1/auth/user-info')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual({
          permissions: { resourceName: 'x', scopes: ['view', 'delete'] },
          name: 'Name',
          username: 'username',
          email: 'email',
          emailVerified: true,
          realm: 'realm',
          tenant: 'realm',
        });
        done();
      });
  });


  test('/backstage/v1/auth/user-info: renew token ok', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockExpiredToken);

    mockKeyInfoByToken.mockResolvedValueOnce(userInfo);

    mockTokenByRefresh.mockResolvedValueOnce({
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
      refreshExpiresAt: 'refreshExpiresAt',
      accessTokenExpiresAt: 'accessTokenExpiresAt',
    });

    api
      .get('/backstage/v1/auth/user-info')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual({
          permissions: { resourceName: 'x', scopes: ['view', 'delete'] },
          name: 'Name',
          username: 'username',
          email: 'email',
          emailVerified: true,
          realm: 'realm',
          tenant: 'realm',
        });
        done();
      });
  });

  test('/backstage/v1/auth/user-info: cant renew token', (done) => {
    mockRedisGet.mockImplementationOnce(() => Promise.resolve({
      cookie: {
        originalMaxAge: null,
        expires: null,
        secure: false,
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
      },
      realm: 'realm',
      codeVerifier: 'codeVerifier',
      accessToken: 'accessToken',
      accessTokenExpiresAt: new Date(2020, 11, 17),
      refreshToken: 'refreshToken',
    }));

    mockTokenByRefresh.mockRejectedValueOnce('not ok');

    api
      .get('/backstage/v1/auth/user-info')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(401);
        expect(response.body).toStrictEqual({
          error: 'It was not possible to renew the token.',
        });
        done();
      });
  });

  test('/backstage/v1/auth/user-info: without token', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockIncomplete);

    api
      .get('/backstage/v1/auth/user-info')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(401);
        expect(response.body).toStrictEqual({
          error: 'There is no valid session.',
        });
        done();
      });
  });

  test('/backstage/v1/auth/user-info: unexpected error', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    mockKeyInfoByToken.mockRejectedValueOnce(new Error());

    api
      .get('/backstage/v1/auth/user-info')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(500);
        expect(response.body).toStrictEqual({
          error: 'An unexpected error has occurred.',
        });
        done();
      });
  });


  test('/backstage/v1/auth/revoke: ok', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    api
      .get('/backstage/v1/auth/revoke')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://buildUrlLogout:8000');
        done();
      });
  });

  test('/backstage/v1/auth/revoke: no session ok', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionBaseObj);
    api
      .get('/backstage/v1/auth/revoke')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://localhost:8000/?error=There+is+no+active+session');
        done();
      });
  });

  test('/backstage/v1/auth/revoke: cant destroy session', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    mockRedisDestroy.mockRejectedValueOnce(new Error());
    api
      .get('/backstage/v1/auth/revoke')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBe(303);
        expect(response.redirect).toBe(true);
        expect(response.header.location).toBe('http://buildUrlLogout:8000');
        done();
      });
  });

  test('/backstage/v1/api-docs: Check if API-docs loads', (done) => {
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    expect.assertions(2);
    api
      .get('/backstage/v1/api-docs')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBeGreaterThanOrEqual(200);
        expect(response.statusCode).toBeLessThan(400);
        done();
      });
  });

  test('/backstage/v1/graphql: Check if GraphQL loads', (done) => {
    expect.assertions(2);
    mockRedisGet.mockResolvedValueOnce(sessionMockComplete);
    api
      .get('/backstage/v1/graphql?query=%0A%0A%7B%0A%20%20getConfig(user%3A%20%22user%22%2C%20tenant%3A%20%22tenant%22)%0A%7D%0A%0A')
      .set('Cookie', [cookies])
      .then((response) => {
        expect(response.statusCode).toBeGreaterThanOrEqual(200);
        expect(response.statusCode).toBeLessThan(400);
        done();
      });
  });
});
