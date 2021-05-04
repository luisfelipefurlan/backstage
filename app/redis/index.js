const redis = require('redis');
const { promisify } = require('util');
const {
  ConfigManager: { getConfig },
  Logger,
} = require('@dojot/microservice-sdk');
const { flatten, unflatten } = require('flat');
const RedisManagement = require('./RedisManagement');

const { replaceTLSFlattenConfigs } = require('../Utils');
const { createRedisHealthChecker } = require('./Utils');

const logger = new Logger('backstage:Redis');

const { redis: redisConfig } = getConfig('BS');


/**
 * A function that receives an options object as parameter including
 * the retry attempt, the total_retry_time indicating how much time passed
 * since the last time connected, the error why the connection was lost and
 * the number of times_connected in total. If you return a number from this function,
 * the retry will happen exactly after that time in milliseconds.
 *  If you return a non-number, no further retry will happen and all offline
 * commands are flushed with errors. Return an error to return that specific
 * error to all offline commands.
 *
 * @param {Object} options
 * @returns
 */
const retryStrategy = (options) => {
  logger.warn(`retryStrategy: options=${JSON.stringify(options)}`);

  // reconnect after
  return redisConfig['reconnect.after.ms'];
};


/**
 * Wrapper for Redis
 */
class Redis {
  /**
   *
   * @param {an instance of @dojot/microservice-sdk.ServiceStateManager
   *          with register services 'redis-pub' and 'redis-sub'} serviceState
   *          Manages the services' states, providing health check and shutdown utilities.
   */
  constructor(serviceState) {
    const { client } = unflatten(redisConfig);
    const configClient = flatten(client);

    const redisConfigReplaced = replaceTLSFlattenConfigs(configClient);

    this.redisPub = redis.createClient({
      retry_strategy: retryStrategy,
      ...redisConfigReplaced,
    });
    this.redisSub = redis.createClient({
      retry_strategy: retryStrategy,
      ...redisConfigReplaced,
    });

    this.serviceState = serviceState;


    this.createRedisAsync();


    this.management = new RedisManagement(
      this.redisPubAsync,
      this.redisSubAsync,
    );

    this.initSub = this.management.initSub.bind(this.management);
    this.initPub = this.management.initPub.bind(this.management);

    this.redisPub.on('connect', () => {
      logger.debug('Redis pub is connect.');
      this.initPub();
      this.serviceState.signalReady('redis-pub');
    });

    this.redisSub.on('connect', async () => {
      try {
        logger.debug('Redis sub is connect.');
        await this.initSub(redisConfig.db);
        logger.debug('Redis sub is connected!');
        this.serviceState.signalReady('redis-sub');
      } catch (e) {
        // Using async functions with event handlers is problematic,
        // because it can lead to an unhandled rejection
        logger.debug('onConnect: Redis sub, e=', e);
      }
    });

    this.handleEvents(this.redisPub, 'pub', this.serviceState);
    this.handleEvents(this.redisSub, 'sub', this.serviceState);

    createRedisHealthChecker(this.redisPub, 'redis-pub', serviceState, logger);
    createRedisHealthChecker(this.redisSub, 'redis-sub', serviceState, logger);

    this.registerShutdown();
  }


  /**
 * Handles redis events and reflects them in the service state manager
 * @private
 *
 * @param {string} clientRedis
 * @param {string} nameClient
 */
  handleEvents(clientRedis, nameClient) {
    clientRedis.on('ready', () => {
      logger.info(`Redis ${nameClient} is ready.`);
    });
    clientRedis.on('error', (error) => {
      logger.error(`Redis ${nameClient} has an error:`, error);
      if (error.code === 'CONNECTION_BROKEN') {
        logger.warn('The service will be shutdown for exceeding attempts to reconnect with Redis');
        this.serviceState.shutdown().then(() => {
          logger.warn('The service was gracefully shutdown');
        }).catch(() => {
          logger.error('The service was unable to be shutdown gracefully');
        });
      }
    });
    clientRedis.on('end', () => {
      logger.warn(`Redis ${nameClient} was ended.`);
      this.serviceState.signalNotReady(`redis-${nameClient}`);
    });
    clientRedis.on('warning', (warning) => {
      logger.warn(`Redis ${nameClient} has an warning:`, warning);
    });
    clientRedis.on('reconnecting', () => {
      logger.warn(`Redis ${nameClient} is trying to reconnect...`);
      this.serviceState.signalNotReady(`redis-${nameClient}`);
    });
  }

  /**
   * Create an asynchronous version of the net methods that will be used
   * @private
   */
  createRedisAsync() {
    this.redisPubAsync = {
      get: promisify(this.redisPub.get).bind(this.redisPub),
      set: promisify(this.redisPub.set).bind(this.redisPub),
      expire: promisify(this.redisPub.expire).bind(this.redisPub),
      del: promisify(this.redisPub.del).bind(this.redisPub),
      quit: promisify(this.redisPub.quit).bind(this.redisPub),
      send_command: (this.redisPub.send_command).bind(this.redisPub),
    };

    this.redisSubAsync = {
      subscribe: promisify(this.redisSub.subscribe).bind(this.redisSub),
      quit: promisify(this.redisSub.quit).bind(this.redisSub),
      on: (this.redisSub.on).bind(this.redisSub),
      unsubscribe: promisify(this.redisSub.unsubscribe).bind(this.redisSub),
    };
  }

  /**
  * Returns a RedisManagement instance
  * @returns {RedisManagement}
  */
  getManagementInstance() {
    return this.management;
  }

  /**
   * Registers a shutdown to the redis
   * @private
   */
  registerShutdown() {
    this.serviceState.registerShutdownHandler(async () => {
      logger.debug('ShutdownHandler: Trying close redis sub...');
      await this.redisSubAsync.unsubscribe();
      await this.redisSubAsync.quit();
      logger.warn('ShutdownHandler: Closed redis sub.');
    });
    this.serviceState.registerShutdownHandler(async () => {
      logger.debug('ShutdownHandler: Trying close redis pub...');
      await this.redisPubAsync.quit();
      logger.warn('ShutdownHandler: Closed redis pub.');
    });
  }
}

module.exports = Redis;
