const {
  ConfigManager: { getConfig }, Logger,
} = require('@dojot/microservice-sdk');

const { createProxyMiddleware } = require('http-proxy-middleware');
const { replaceTLSFlattenConfigs } = require('../../Utils');

const { proxy: configProxy } = getConfig('BS');

const configProxyReplaced = replaceTLSFlattenConfigs(configProxy);

/**
 *  Generates configuration file for http-proxy-middleware
 * @param {string} mountPoint
 * @returns
 */
const proxyConfiguration = (mountPoint) => {
  let configFinalReplaced = {
    target: configProxy.target,
    logLevel: configProxy['log.level'],
    logProvider: () => new Logger('backstage:express/interceptors/Proxy'),
    changeOrigin: true,
    pathRewrite: (path) => path.replace(`${mountPoint}/proxy`, ''),
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader('Authorization', `Bearer ${req.token}`);
    },
    secure: configProxy.secure,
  };

  if (configProxyReplaced.ssl) {
    configFinalReplaced = {
      ...configFinalReplaced,
      ssl: configProxyReplaced.ssl,
    };
  }

  return configFinalReplaced;
};

/**
 * Middleware proxy that is an endpoint the proxy,
 * for for internal calls to dojot via api gateway (kong). It adds
 * `Authorization: 'Bearer TOKEN'` to the request header based on the current session.
 * Example: http://localhost:8000/backstage/v1/proxy/device to http://apigw:8000/device
 *
 * @param {string} mountPoint
 * @returns
 */
module.exports = ({ mountPoint }) => ({
  name: 'proxy',
  path: `${mountPoint}/proxy`,
  middleware: [
    (req, res, next) => {
      // inject token obtained from the session
      req.token = req.session.accessToken;
      return next();
    },
    createProxyMiddleware(
      proxyConfiguration(mountPoint),
    ),
  ],
});
