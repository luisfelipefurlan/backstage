
const {
  Logger,
} = require('@dojot/microservice-sdk');

const logger = new Logger('backstage:express/interceptors/session/SessionStore');


module.exports = (session) => {
  const { Store } = session;

  /**
   * Class to be used with session-express, see more about Sessions Stores
   * at https://github.com/expressjs/session#session-store-implementation
   *
   * NOTE: This class implementation is based on
   * https://github.com/tj/connect-redis/tree/v5.1.0 which has an MIT license.
   *
   */
  class SessionStore extends Store {
    constructor(options = {}, redis, keycloak) {
      super(options);
      this.redisManagement = redis.getManagementInstance();
      const logoutBound = keycloak.getRequestsInstance()
        .logout.bind(keycloak.getRequestsInstance());
      this.redisManagement.setFuncToCallBeforeDestroy(logoutBound);
    }

    /**
     * This  method is used to get a session from the store
     * given a session ID (sid). The callback should be called as
     * callback(error, session).
     *
     * The session argument should be a session if found,
     * otherwise null or undefined if the session
     * was not found (and there was no error).
     * A special case is made when error.code === 'ENOENT'
     * to act like callback(null, null).
     *
     * @param {string} sid  session ID
     * @param {function} cb
     * @returns
     */
    async get(sid, cb = () => {}) {
      logger.debug(`get: sid=${sid}`);
      try {
        const data = await this.redisManagement.get(sid);
        return cb(null, data);
      } catch (err) {
        logger.warn(`get: err=${err.stack || err}`);
        return cb(err);
      }
    }

    /**
     * This method is used to set a session into the store given a
     * session ID  and session  object.
     *
     * The callback should be called as callback(error)
     * once the session has been set in the store.
     *
     * @param {string} sid session ID
     * @param {Object} sess session
     * @param {function} cb
     * @returns
     */
    async set(sid, sess, cb = () => {}) {
      logger.debug(`set: sid=${sid}`);
      try {
        await this.redisManagement.set(sid, sess);
        return cb(null, 'OK');
      } catch (err) {
        logger.warn(`set: err=${err.stack || err}`);
        return cb(err);
      }
    }

    /**
     * This method is used to destroy/delete a session from
     * the store given a session ID. The callback should be
     * called as callback(error) once the session is destroyed
     *
     * @param {string} sid session ID
     * @param {function} cb callback
     * @returns
     */
    async destroy(sid, cb = () => {}) {
      logger.debug(`destroy: sid=${sid}`);
      try {
        await this.redisManagement.destroy(sid);
        return cb(null, 'OK');
      } catch (err) {
        logger.warn(`destroy: err=${err.stack || err}`);
        return cb(err);
      }
    }

    /**
     * This method is used to "touch" a given session given a
     * session ID and session  object. The callback
     * should be called as callback(error) once the session has been touched.
     *
     * This is primarily used when the store will automatically delete idle
     * sessions and this method is used to signal to the store
     * the given session is active, potentially resetting the idle timer.
     *
     * @param {String} sid session ID
     * @param {object} sess session
     * @param {function(error)} cb callback
     * @returns
     */
    async touch(sid, sess, cb = () => {}) {
      logger.debug(`touch: sid=${sid}`);
      try {
        const ret = await this.redisManagement.restartIdleTTL(sid);
        if (!ret) {
          return cb(null, 'EXPIRED');
        }
        return cb(null, 'OK');
      } catch (err) {
        logger.warn('touch: err=', err);
        return cb(err);
      }
    }
  }


  return SessionStore;
};
