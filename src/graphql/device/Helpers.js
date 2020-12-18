const _ = require('lodash');
const LOG = require('../../utils/Log');
const axios = require('axios');
const UTIL = require('../utils/AxiosUtils');
const CacheService = require('../../utils/cache');

const operations = {
  LAST: {
    MOUTHS: 4,
    MINUTES: 3,
    HOURS: 2,
    DAYS: 1,
    N: 0,
  },
  MAP: 5,
  CSMAP: 6,
  TEMPLATES: 7,
};

const reduceList = (prop) => {
  const array = [];
  Object.keys(prop).forEach(listKey => {
    array.push(
      prop[listKey].reduce((acc, fItem) => {
        const obj = {...fItem};
        Object.keys(obj).forEach(item => {
          acc[item] = obj[item];
        });
        return acc;
      }, {}),
    );
  });
  return array;
};

const convertList = list => _.groupBy(list, item => item.timestamp);

const formatValueType = (valType) => {
  let valueType = '';
  switch (valType) {
    case 'integer':
      valueType = 'NUMBER';
      break;
    case 'float':
      valueType = 'NUMBER';
      break;
    case 'bool':
      valueType = 'BOOLEAN';
      break;
    case 'string':
      valueType = 'STRING';
      break;
    case 'geo:point':
      valueType = 'GEO';
      break;
    default:
      valueType = 'UNDEFINED';
  }
  return valueType;
}

const parseGeo = value => {
  const toParse = value ? value : '[0, 0]';
  const [lat, long] = toParse.split(',')
  return [parseFloat(lat), parseFloat(long)]
}

const resolveDeviceAttributes = async (promises) => {
  const attributes = [];

  await Promise.all(promises).then((values) => {
    Object.keys(values).forEach((keys) => {
      if (!!values[keys] && !!values[keys].data && Array.isArray(values[keys].data)) {
        attributes.push(...values[keys].data)
      }
    });
  }).catch((error) => {
    LOG.error(error.stack || error);
    throw error;
  });
  return attributes;
};

const formatOutPut = (attributes, operationType, staticAttributes) => {
  const history = [];
  const historyObj = {};

  attributes.forEach(({attr, device_id, value, ts}) => {
    if (operationType === operations.MAP) {
      historyObj[`${device_id}${attr}`] = {
        value: parseGeo(value),
        timestamp: ts.length > 20 ? `${ts.substring(0, ts.length - (ts.length - 19))}Z` : ts,
      }
    } else if (operationType === operations.CSMAP) {
      const value = _.find(staticAttributes, staticAttribute => {
        return staticAttribute.deviceID === device_id
      });
      historyObj[`${device_id}${attr}`] = {
        value: parseGeo(value.static_value),
        timestamp: ts.length > 20 ? `${ts.substring(0, ts.length - (ts.length - 19))}Z` : ts,
        deviceLabel: value.deviceLabel,
      }
    } else {
      history.push({
        [`${device_id}${attr}`]: isNaN(value) ? value : parseFloat(value),
        timestamp: ts.length > 20 ? `${ts.substring(0, ts.length - (ts.length - 19))}Z` : ts,
      });
    }
  });
  return {history, historyObj}
};

const deviceTtl = 60 * 10; //cache com duração de 10 minutos
const attributeCache = new CacheService(deviceTtl); // Cria uma instancia de cache

const devicesPromises = (devices, queryStringParams, optionsAxios) => {
  const historyPromiseArray = []
  devices.forEach((device) => {
    if (device.attrs) {
      device.attrs.forEach((attribute) => {
        const requestString = `/history/device/${device.deviceID}/history?attr=${attribute}${queryStringParams ? `${queryStringParams}` : ''}`;
        // const promiseHistory = axios(optionsAxios(UTIL.GET, requestString))
        const promiseHistory = attributeCache.get(requestString, () => axios(optionsAxios(UTIL.GET, requestString)))
          .catch(() => Promise.resolve(null));
        historyPromiseArray.push(promiseHistory);
      });
    }
  });

  return historyPromiseArray;
}

module.exports = {
  reduceList,
  convertList,
  formatValueType,
  parseGeo,
  resolveDeviceAttributes,
  formatOutPut,
  devicesPromises,
  operations
};
