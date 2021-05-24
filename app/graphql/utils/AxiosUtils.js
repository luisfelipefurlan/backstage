const {
  ConfigManager: { getConfig },
  Logger,
} = require('@dojot/microservice-sdk');
const https = require('https');
const { replaceTLSFlattenConfigs } = require('../../Utils');

const {
  graphql: configGraphql,
} = getConfig('BS');

const logger = new Logger('backstage:graphql/utils/AxiosUtils');

let httpsAgent = null;
if (configGraphql.secure) {
  const configReplaced = replaceTLSFlattenConfigs(configGraphql);
  httpsAgent = new https.Agent(
    { ...configReplaced.ssl },
  );
  logger.info('Requests will happen over https');
  logger.debug('...tls configs=', configReplaced.ssl);
} else {
  logger.info('Requests will not happen over https');
}


class AxiosUtils {
  static get GET() {
    return 'GET';
  }

  static get POST() {
    return 'POST';
  }

  static get DELETE() {
    return 'DELETE';
  }

  static optionsAxios(method, url, token, baseUrl = configGraphql['base.url']) {
    const objConfigAxios = {
      method,
      baseURL: baseUrl,
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      url,
    };

    if (httpsAgent) {
      objConfigAxios.httpsAgent = httpsAgent;
    }
    return objConfigAxios;
  }

  static handleErrorAxios(error) {
    if (error.response && error.response.status && error.response.data) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = AxiosUtils;
