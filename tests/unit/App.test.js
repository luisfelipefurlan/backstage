const mockConfig = {
  lightship: { a: 'abc' },
  app: {
    'base.url': 'http://localhost:8000',
    'internal.base.url': 'http://apigw:8000',
  },
  gui: {
    'return.url': 'http://localhost:8000/return',
    'home.url': 'http://localhost:8000',
  },
};

const mockSdk = {
  ConfigManager: {
    getConfig: jest.fn(() => mockConfig),
    transformObjectKeys: jest.fn((obj) => obj),
  },
  ServiceStateManager:
    jest.fn().mockImplementation(() => ({
      registerService: jest.fn(),
    })),
  Logger: jest.fn(() => ({
    debug: () => jest.fn(),
    error: () => jest.fn(),
    info: () => jest.fn(),
    warn: () => jest.fn(),
  })),
};

jest.mock('@dojot/microservice-sdk', () => mockSdk);


const mockServerRegisterShutdown = jest.fn();
const mockServerInit = jest.fn();
const mockServer = jest.fn().mockImplementation(() => ({
  registerShutdown: mockServerRegisterShutdown,
  init: mockServerInit,
}));
jest.mock('../../app/Server', () => mockServer);
const mockPostgresInit = jest.fn();
const mockPostgres = {
  init: mockPostgresInit,
};
jest.mock('../../app/postgres', () => mockPostgres);
jest.mock('../../app/express', () => jest.fn());

const mockKeycloakInit = jest.fn();
const mockKeycloak = {
  init: mockKeycloakInit,
};
jest.mock('../../app/keycloak', () => mockKeycloak);
jest.mock('../../app/redis', () => jest.fn());

const App = require('../../app/App');

describe('App', () => {
  let app = null;
  beforeAll(() => {
    app = null;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
  });

  afterEach(() => {
  });

  test('instantiate class and init with error', async () => {
    const msg = 'error';
    mockPostgresInit.mockRejectedValueOnce(new Error(msg));

    expect.assertions(1);
    app = new App();
    try {
      await app.init();
    } catch (e) {
      expect(e.message).toBe(msg);
    }
  });

  test('instantiate class and init ok ', async () => {
    mockPostgresInit.mockResolvedValueOnce('Ok');

    expect.assertions(1);
    app = new App();
    await app.init();
    expect(mockPostgresInit).toBeCalled();
  });
});
