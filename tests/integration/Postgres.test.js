/* eslint-disable security/detect-object-injection */
const mockConfig = {
  postgres: {
    'client.host': 'postgres',
    'client.port': 5432,
    'client.database': 'backstage',
    'client.user': 'backstage',
    'client.password': 'backstage',
    'healthcheck.ms': 30000,
  },
};

const mockSdk = {
  ConfigManager: {
    getConfig: jest.fn(() => mockConfig),
    transformObjectKeys: jest.fn((obj) => obj),
  },
  Logger: jest.fn(() => ({
    debug: () => jest.fn(),
    error: () => jest.fn(),
    info: () => jest.fn(),
    warn: () => jest.fn(),
  })),
};
jest.mock('@dojot/microservice-sdk', () => mockSdk);

const mockAddHealthChecker = jest.fn();
const mockRegisterShutdownHandler = jest.fn();
const mockSignalReady = jest.fn();
const mockSignalNotReady = jest.fn();
const serviceStateMock = {
  addHealthChecker: mockAddHealthChecker,
  registerShutdownHandler: mockRegisterShutdownHandler,
  signalReady: mockSignalReady,
  signalNotReady: mockSignalNotReady,
};

const mockPgClientQuery = jest.fn();
const mockPgClientRelease = jest.fn();
const mockPgClient = {
  query: mockPgClientQuery,
  release: mockPgClientRelease,
};

const reqEventMapMock = {};
const mockConnect = jest.fn();
const mockEnd = jest.fn();
const mockPg = {
  Pool: jest.fn(() => ({
    on: jest.fn().mockImplementation((event, onCallback) => {
      if (!reqEventMapMock[event]) {
        reqEventMapMock[event] = [];
      }
      reqEventMapMock[event].push(onCallback);
    }),
    connect: mockConnect,
    end: mockEnd,
  })),
};
jest.mock('pg', () => mockPg);


const postgres = require('../../app/postgres');

describe('Postgres tests', () => {
  beforeAll(() => {
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
  });
  afterEach(() => {
  });
  test('init', async () => {
    mockConnect.mockImplementationOnce(() => Promise.resolve(mockPgClient));
    mockPgClientQuery.mockResolvedValueOnce('ok');

    await postgres.init(serviceStateMock);

    reqEventMapMock.connect[0]();

    expect(mockSignalReady).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalled();
    expect(mockPgClientQuery).toHaveBeenCalledWith({ text: 'CREATE TABLE IF NOT EXISTS user_config ( tenant varchar(255) NOT NULL, username varchar(255) NOT NULL,configuration json NOT NULL, last_update timestamp WITH time zone DEFAULT CURRENT_TIMESTAMP, CONSTRAINT unique_user PRIMARY KEY (tenant, username) );' });
    expect(mockPgClientRelease).toHaveBeenCalled();
    expect(postgres.initialized).toBe(true);
  });

  test('createInfluxHealthChecker - heath', async () => {
    mockConnect.mockImplementationOnce(() => Promise.resolve(mockPgClient));
    mockPgClientQuery.mockResolvedValueOnce('ok');
    postgres.createHealthChecker();

    const callback = mockAddHealthChecker.mock.calls[0][1];

    const ready = jest.fn();
    const notReady = jest.fn();
    await callback(ready, notReady);

    expect(mockAddHealthChecker).toHaveBeenCalled();
    expect(ready).toHaveBeenCalled();
    expect(notReady).not.toHaveBeenCalled();
  });

  test('createInfluxHealthChecker - not heath', async () => {
    mockConnect.mockImplementationOnce(() => Promise.resolve(mockPgClient));
    mockPgClientQuery.mockRejectedValueOnce(new Error());

    postgres.createHealthChecker();

    const callback = mockAddHealthChecker.mock.calls[0][1];

    const ready = jest.fn();
    const notReady = jest.fn();
    await callback(ready, notReady);

    expect(mockAddHealthChecker).toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
    expect(notReady).toHaveBeenCalled();
  });

  test('registerShutdown', async () => {
    mockEnd.mockResolvedValueOnce('ok');
    postgres.registerShutdown();

    const callback = mockRegisterShutdownHandler.mock.calls[0][0];
    await callback();

    expect(mockEnd)
      .toHaveBeenCalledTimes(1);

    expect(mockRegisterShutdownHandler).toHaveBeenCalled();
  });
});
