const { Pool } = require('pg');
const {
  ConfigManager: { getConfig },
  Logger,
} = require('@dojot/microservice-sdk');
const { flatten, unflatten } = require('flat');
const { QUERY_CREATE_TABLE_USER_CONFIG } = require('./Queries');
const { replaceTLSFlattenConfigs } = require('../Utils');

const logger = new Logger('backstage:Postgres');

const { postgres: configPG } = getConfig('BS');


/**
 * Wrapper for Postgres
 */
class Postgres {
  /**
   *
   * @param {an instance of @dojot/microservice-sdk.ServiceStateManager
   *          with register service 'postgres'} serviceState
   *          Manages the services' states, providing health check and shutdown utilities.
   */
  async init(serviceState) {
    try {
      const { client } = unflatten(configPG);
      const configClient = flatten(client);

      const configClientPGReplaced = replaceTLSFlattenConfigs(configClient);

      this.serviceState = serviceState;
      this.serviceName = 'postgres';
      this.pool = new Pool({
        ...configClientPGReplaced,
      });
      this.handleEvents();
      this.createHealthChecker();
      this.registerShutdown();
      this.initialized = true;
      await this.createTableUserConfigIfNotExist();
    } catch (error) {
      logger.error('init: error=', error);
      throw error;
    }
  }

  /**
   * Listens to postgres events and notifies the service state manager
   * @private
   */
  handleEvents() {
    this.pool.on('connect', () => {
      logger.debug('handleEvents: postgres -> connected');
      this.serviceState.signalReady(this.serviceName);
    });

    // Whenever a client is checked out from the pool the pool will
    // emit the acquire event with the client that was acquired.
    this.pool.on('acquire', () => {
      logger.debug('handleEvents: postgres -> acquire');
    });

    // Whenever a client is closed & removed from the pool
    // the pool will emit the remove event.
    this.pool.on('remove', () => {
      logger.debug('handleEvents: postgres -> remove');
    });

    this.pool.on('error', (error) => {
      logger.error('handleEvents: postgres error. error=', error);
      this.serviceState.signalNotReady(this.serviceName);
    });
  }

  /**
   * Execute query
   *
   * @param {object | string } query Query object ou string that the pg library can handle,
   *                       text and values are just a few of them, there are more keys
   * @param {string} query.text Query
   * @param {string} query.values Parameters
   * @returns {object} return from query
   */
  async query(query) {
    this.checkInitiated();
    logger.debug(`query: Executing query=${JSON.stringify(query)}`);
    try {
      const client = await this.pool.connect();
      const result = await client.query(query);
      logger.debug('query: The query returned=', result);
      client.release();
      return result;
    } catch (err) {
      logger.warn('query: error=', err);
      throw err;
    }
  }

  /**
   * Checks whether it was started properly by calling the init method
   * @private
   */
  checkInitiated() {
    if (!this.initialized) {
      throw new Error('Call init method first');
    }
  }


  /**
   * Checks if the user_config table exists, if the creation does not exist
   * @private
   */
  async createTableUserConfigIfNotExist() {
    try {
      await this.query({ text: QUERY_CREATE_TABLE_USER_CONFIG });
      logger.info('Table user_config is available to use.');
    } catch (err) {
      logger.error('checkTable: err=', err);
      throw err;
    }
  }

  /**
  * Creates a 'healthCheck'
  * @private
  */
  createHealthChecker() {
    const healthChecker = async (signalReady, signalNotReady) => {
      const isReady = await this.checkLiveness();
      if (isReady) {
        logger.debug('health: healthy');
        signalReady();
      } else {
        logger.error('health: unhealthy');
        signalNotReady();
      }
    };
    this.serviceState.addHealthChecker(this.serviceName, healthChecker, configPG['healthcheck.ms']);
  }

  /**
   * Checks postgres liveness
   * @private
   */
  async checkLiveness() {
    try {
      const result = await this.query('SELECT NOW();');
      if (!result) {
        logger.error('checkLiveness: false, cause: no stats ');
        return false;
      }
      logger.debug('checkLiveness: true');
      return true;
    } catch (e) {
      logger.error('checkLiveness: false, cause:', e);
      return false;
    }
  }

  /**
   * Registers a shutdown to the redis
   * @private
   */
  registerShutdown() {
    this.serviceState.registerShutdownHandler(async () => {
      logger.debug('ShutdownHandler: Trying close postgres pool...');
      this.initialized = false;
      await this.pool.end();
      logger.warn('ShutdownHandler: Closed postgres pool.');
    });
  }
}

module.exports = new Postgres();
