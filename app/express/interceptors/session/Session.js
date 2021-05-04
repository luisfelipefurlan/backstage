const {
  Logger,
  ConfigManager: { getConfig },
} = require('@dojot/microservice-sdk');
const session = require('express-session');
const createError = require('http-errors');

const SessionStore = require('./SessionStore')(session);

const logger = new Logger('backstage:express/interceptors/session/Session');

const { session: sessionConfig } = getConfig('BS');

// if a secret is not defined, the service is unable to start
if (!sessionConfig.secret) {
  throw new Error('The `session.secret` option is required, please read the topic attention in the readme.');
}

/**
 * Renew the access token through the refresh token if the current access token is expired
 *
 * @param {object} req
 * @param {an instance of ../keycloak} keycloak instance of the Keycloak class
 */
const renewAccessTokenIfNecessary = async (req, keycloak) => {
  logger.debug('renewAccessTokenIfNecessary: ...');
  // checks if the current token is expired
  if ((Date.now() > new Date(req.session.accessTokenExpiresAt).getTime())) {
    logger.debug('renewAccessTokenIfNecessary: Getting a new token...');
    const {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      accessTokenExpiresAt,
      sessionState,
    } = await keycloak.getRequestsInstance().getTokenByRefreshToken(
      req.session.realm,
      req.session.refreshToken,
    );

    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;
    req.session.refreshExpiresAt = refreshExpiresAt;
    req.session.accessTokenExpiresAt = accessTokenExpiresAt;
    req.session.sessionState = sessionState;

    logger.debug('renewAccessTokenIfNecessary: ...got a new token.');
  }
};


/**
 * Middleware responsible for creating a session and managing it
 *
 * @param {String[]} exceptionRoutes  Array with Patchs  that does not need an active session
 *                                    to be accessed
 * @param {an instance of ../keycloak} object.keycloak instance of the Keycloak class
 * @param {an instance of ../redis} object.redis instance of the Redis class
 */
module.exports = ({
  exceptionRoutes,
  keycloak,
  redis,
}) => ({
  name: 'session-express-interceptor',
  middleware:
  [session({
    secret: sessionConfig.secret,
    name: sessionConfig['cookie.name'],
    domain: sessionConfig.domain,
    proxy: sessionConfig.proxy,
    store: new SessionStore({}, redis, keycloak),
    // Forces the session to be saved back to the session store,
    // even if the session was never modified
    resave: false,
    // Forces a session that is "uninitialized" to be saved to the store.
    saveUninitialized: false,
    cookie: {
      // Specifies the value for the Path Set-Cookie.
      // By default, this is set to '/', which is the root path of the domain
      path: sessionConfig['cookie.path'],
      // Specifies the boolean value for the HttpOnly Set-Cookie attribute.
      // When truthy, the HttpOnly attribute is set, otherwise it is not.
      httpOnly: true,
      // Ensures that the browser only sends the cookie over HTTPS.
      secure: sessionConfig['cookie.https'],
      // Specifies the boolean or string to be the value for the SameSite Set-Cookie attribute.
      sameSite: 'strict',
    },
  }),
  async (req, res, next) => {
    logger.debug(`Receiving requisition for: ${req.path}`);

    // These routes do not require Token access in the session
    if (exceptionRoutes.includes(req.path)) {
      return next();
    }
    const err = new createError.Unauthorized();

    if (req.session) {
    // These routes require Token access in the session
      if (req.session.accessToken && req.session.accessTokenExpiresAt) {
        try {
        // Get a new access token with the refresh token
        // if the current access token is expired
          await renewAccessTokenIfNecessary(req, keycloak);
        } catch (e) {
          logger.error(e);
          err.message = 'It was not possible to renew the token.';
          return next(err);
        }
        return next();
      }

      req.session.destroy((errorDestroy) => {
        if (errorDestroy) {
          logger.warn('destroy:', errorDestroy);
        }
      });
    }

    // If  do not find a session with access
    // token returns that was not authorized
    err.message = 'There is no valid session.';
    return next(err);
  },
  ],
});
