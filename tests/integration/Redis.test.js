/* eslint-disable security/detect-object-injection */
const mockConfig = {
  app: {
    'base.url': 'http://localhost:8000',
    'internal.base.url': 'http://apigw:8000',
  },
  redis: {
    'client.host': 'backstage-redis',
    'client.port': 6379,
    'client.db': 0,
    'client.connect_timeout': 3600000,
    'reconnect.after.ms': 5000,
  },
  session: {
    'redis.max.life.time.sec': 86400,
    'redis.max.idle.time.sec': 1800,
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
const reqEventMapMock = {};
const mockSendCommand = jest.fn();
const mockSubscribe = jest.fn((cannel, callback) => callback(null, true));
const mockQuit = jest.fn((callback) => callback());
const mockUnsubscribe = jest.fn((callback) => callback());
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockExpire = jest.fn();
const mockDel = jest.fn();

const mockRedis = {
  createClient: jest.fn(() => ({
    on: jest.fn().mockImplementation((event, onCallback) => {
      if (!reqEventMapMock[event]) {
        reqEventMapMock[event] = [];
      }
      reqEventMapMock[event].push(onCallback);
    }),
    quit: mockQuit,
    get: mockGet,
    set: mockSet,
    expire: mockExpire,
    del: mockDel,
    send_command: mockSendCommand,
    unsubscribe: mockUnsubscribe,
    subscribe: mockSubscribe,
  })),
};
jest.mock('redis', () => mockRedis);

const mockUtils = {
  replaceTLSFlattenConfigs: jest.fn((a) => a),
};

jest.mock('../../app/Utils', () => mockUtils);


const mockAddHealthChecker = jest.fn();
const mockRegisterShutdownHandler = jest.fn();
const mockSignalReady = jest.fn();
const mocksignalNotReady = jest.fn();
const serviceStateMock = {
  addHealthChecker: mockAddHealthChecker,
  registerShutdownHandler: mockRegisterShutdownHandler,
  signalReady: mockSignalReady,
  signalNotReady: mocksignalNotReady,
};


const Redis = require('../../app/redis');

let redis = null;
describe('redis tests', () => {
  beforeAll(() => {
    redis = new Redis(serviceStateMock);
  });
  beforeEach(() => {
  });
  afterAll(() => {
  });
  afterEach(() => {
  });
  test('init', async () => {
    reqEventMapMock.connect[0]();
    await reqEventMapMock.connect[1]();

    reqEventMapMock.ready[0]();
    reqEventMapMock.ready[1]();


    expect(mockSendCommand)
      .toHaveBeenCalled();
    expect(mockSubscribe)
      .toHaveBeenCalled();
    expect(mockSignalReady)
      .toHaveBeenNthCalledWith(1, 'redis-pub');
    expect(mockSignalReady)
      .toHaveBeenNthCalledWith(2, 'redis-sub');
  });

  test('Management get: ok', async () => {
    const valueGet = { a: 1 };
    mockGet
      .mockImplementationOnce((key, callback) => callback(null, true))
      .mockImplementationOnce((key, callback) => callback(null, JSON.stringify(valueGet)));

    const value = await redis.getManagementInstance().get('sid');
    expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));
    expect(mockGet).toHaveBeenNthCalledWith(2, 'session:sid', expect.any(Function));
    expect(value).toStrictEqual(valueGet);
  });

  test('Management get: keyIdle doest exist', async () => {
    mockGet
      .mockImplementationOnce((key, callback) => callback(null, null));

    const value = await redis.getManagementInstance().get('sid');
    expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));

    expect(value).toStrictEqual(null);
  });

  test('Management get: error', async () => {
    expect.assertions(2);
    const msgError = 'x';
    mockGet
      .mockImplementationOnce((key, callback) => callback(new Error(msgError), null));
    try {
      await redis.getManagementInstance().get('sid');
    } catch (e) {
      expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));
      expect(e.message).toStrictEqual(msgError);
    }
  });

  test('Management set: ok', async () => {
    const value = { a: 1, b: 2 };
    const key = 'sid';

    mockSet
      .mockImplementationOnce(((k, v, callback) => callback(null, true)))
      .mockImplementationOnce((k, v, callback) => callback(null, true));
    mockExpire
      .mockImplementationOnce(((k, time, callback) => callback(null, true)))
      .mockImplementationOnce((k, time, callback) => callback(null, true));

    await redis.getManagementInstance().set(key, value);

    expect(mockSet).toHaveBeenNthCalledWith(1, 'session:sid', JSON.stringify(value), expect.any(Function));
    expect(mockSet).toHaveBeenNthCalledWith(2, 'session-idle:sid', 'empty', expect.any(Function));

    expect(mockExpire).toHaveBeenNthCalledWith(1, 'session:sid', 86400, expect.any(Function));
    expect(mockExpire).toHaveBeenNthCalledWith(2, 'session-idle:sid', 120, expect.any(Function));
  });

  test('Management set: error', async () => {
    const value = { a: 1, b: 2 };
    const key = 'sid';
    expect.assertions(2);
    const msgError = 'x';
    mockSet
      .mockImplementationOnce(((k, v, callback) => callback(new Error(msgError), true)));
    try {
      await redis.getManagementInstance().set(key, value);
    } catch (e) {
      expect(mockSet).toHaveBeenNthCalledWith(1, 'session:sid', JSON.stringify(value), expect.any(Function));
      expect(e.message).toStrictEqual(msgError);
    }
  });

  test('Management destroy: ok', async () => {
    const valueGet = {
      accessToken: 'accessToken',
      realm: 'realm',
      refreshToken: 'refreshToken',
    };
    mockGet
      .mockImplementationOnce((k, callback) => callback(null, true))
      .mockImplementationOnce((k, callback) => callback(null, JSON.stringify(valueGet)));

    mockDel
      .mockImplementationOnce(((k, callback) => callback(null, true)))
      .mockImplementationOnce((k, callback) => callback(null, true));

    const asyncMock = jest.fn().mockImplementation(() => Promise.resolve('ok'));
    redis.getManagementInstance().setFuncToCallBeforeDestroy(asyncMock);

    await redis.getManagementInstance().destroy('sid');

    expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));
    expect(mockGet).toHaveBeenNthCalledWith(2, 'session:sid', expect.any(Function));
    expect(mockDel).toHaveBeenNthCalledWith(1, 'session:sid', expect.any(Function));
    expect(mockDel).toHaveBeenNthCalledWith(2, 'session-idle:sid', expect.any(Function));
    expect(asyncMock).toHaveBeenCalledWith(
      valueGet.realm,
      valueGet.accessToken,
      valueGet.refreshToken,
    );
  });
  test('Management destroy: err', async () => {
    expect.assertions(2);
    const msgError = 'x';
    mockGet
      .mockImplementationOnce((key, callback) => callback(new Error(msgError), null));

    try {
      await redis.getManagementInstance().destroy('sid');
    } catch (e) {
      expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));
      expect(e.message).toStrictEqual(msgError);
    }
  });

  test('restartIdleTTL: ok', async () => {
    const key = 'sid';

    mockExpire
      .mockImplementationOnce(((k, time, callback) => callback(null, true)));

    await redis.getManagementInstance().restartIdleTTL(key);

    expect(mockExpire).toHaveBeenNthCalledWith(1, 'session-idle:sid', 1800, expect.any(Function));
  });

  test('restartIdleTTL: error', async () => {
    expect.assertions(2);
    const msgError = 'x';
    mockExpire
      .mockImplementationOnce(((k, time, callback) => callback(new Error(msgError), true)));

    try {
      await redis.getManagementInstance().restartIdleTTL('sid');
    } catch (e) {
      expect(mockExpire).toHaveBeenNthCalledWith(1, 'session-idle:sid', 1800, expect.any(Function));
      expect(e.message).toStrictEqual(msgError);
    }
  });

  test('onExpiration', async () => {
    const valueGet = {
      accessToken: 'accessToken',
      realm: 'realm',
      refreshToken: 'refreshToken',
    };
    mockGet
      .mockImplementationOnce((k, callback) => callback(null, true))
      .mockImplementationOnce((k, callback) => callback(null, JSON.stringify(valueGet)));

    mockDel
      .mockImplementationOnce(((k, callback) => callback(null, true)))
      .mockImplementationOnce((k, callback) => callback(null, true));

    const asyncMock = jest.fn().mockImplementation(() => Promise.resolve('ok'));
    redis.getManagementInstance().setFuncToCallBeforeDestroy(asyncMock);

    await redis.getManagementInstance().onExpiration('channel', 'session-idle:sid');

    expect(mockGet).toHaveBeenNthCalledWith(1, 'session-idle:sid', expect.any(Function));
    expect(mockGet).toHaveBeenNthCalledWith(2, 'session:sid', expect.any(Function));
    expect(mockDel).toHaveBeenNthCalledWith(1, 'session:sid', expect.any(Function));
    expect(mockDel).toHaveBeenNthCalledWith(2, 'session-idle:sid', expect.any(Function));
    expect(asyncMock).toHaveBeenCalledWith(
      valueGet.realm,
      valueGet.accessToken,
      valueGet.refreshToken,
    );
  });

  test('registerShutdown', async () => {
    redis.registerShutdown();

    const callback = mockRegisterShutdownHandler.mock.calls[0][0];
    await callback();
    const callback2 = mockRegisterShutdownHandler.mock.calls[1][0];
    await callback2();

    expect(mockQuit)
      .toHaveBeenCalledTimes(2);

    expect(mockUnsubscribe)
      .toHaveBeenCalledTimes(1);

    expect(mockRegisterShutdownHandler).toHaveBeenCalled();
  });
});
