
const { ConfigManager, Logger, WebUtils } = require('@dojot/microservice-sdk');

const authRoutes = require('./routes/v1/Auth');
const openApiValidatorInterceptor = require('./interceptors/OpenApiValidator');
const graphQLInterceptor = require('./interceptors/GraphQL');
const sessionInterceptor = require('./interceptors/session/Session');
const swaggerInterceptor = require('./interceptors/Swagger');
const proxyInterceptor = require('./interceptors/Proxy');

const logger = new Logger('backstage:express');

const {
  express: configExpress,
} = ConfigManager.getConfig('BS');

/**
 * Creates an express instance
 *
 * @param {an instance of @dojot/microservice-sdk.ServiceStateManager} serviceState
 *          Manages the services' states, providing health check and shutdown utilities.
 *
 * @param {string}mountPoint Start of all routes
 *
 * @param {an instance of ../redis}object.redis instance of the Redis class
 * @param {an instance of ../keycloak}object.keycloak instance of the Keycloak class
 *
 * @throws  Some error if cannot create an express instance
 *
 * @returns {express}
 */
module.exports = (serviceState, mountPoint, {
  redis,
  keycloak,
}) => {
  const { defaultErrorHandler } = WebUtils.framework;

  const {
    responseCompressInterceptor,
    requestIdInterceptor,
    beaconInterceptor,
    requestLogInterceptor,
    readinessInterceptor,
  } = WebUtils.framework.interceptors;

  return WebUtils.framework.createExpress({
    interceptors: [
      // The order of the interceptors matters
      swaggerInterceptor({
        mountPoint,
      }),
      openApiValidatorInterceptor(),
      readinessInterceptor({
        stateManager: serviceState,
        logger,
      }),
      beaconInterceptor({
        stateManager: serviceState,
        logger,
      }),
      requestIdInterceptor(),
      requestLogInterceptor({
        logger,
      }),
      responseCompressInterceptor(),
      sessionInterceptor({
        exceptionRoutes: [
          `${mountPoint}/auth`,
          `${mountPoint}/auth/return`,
          `${mountPoint}/auth/revoke`,
        ],
        keycloak,
        redis,
      }),
      proxyInterceptor({
        mountPoint,
      }),
      graphQLInterceptor({
        mountPoint,
      }),
    ],
    routes: ([
      authRoutes({
        mountPoint,
        keycloak,
      }),
    ]).flat(),
    errorHandlers: [
      // The order of the error handlers matters
      defaultErrorHandler({
        logger,
      }),
    ],
    logger,
    supportTrustProxy: configExpress.trustproxy,
    catchInvalidRequest: true,
  });
};
