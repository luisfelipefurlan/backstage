const _ = require('lodash');
const LOG = require('../../utils/Log');
const axios = require('axios');
const UTIL = require('../utils/AxiosUtils');

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
  console.log(value);
  const [lat, long] = value.split(',')
  console.log(lat);
  console.log(long);
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

const formatOutPut = (attributes, operationType) => {
  const history = [];
  const historyObj = {};

  attributes.forEach(({attr, device_id, value, ts}) => {
    if (operationType === 5) {
      historyObj[`${device_id}${attr}`] = {
        value: parseGeo(value),
        timestamp: ts.length > 20 ? `${ts.substring(0, ts.length - (ts.length - 19))}Z` : ts,
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

const devicesPromises = (devices, queryStringParams, optionsAxios) => {
  const historyPromiseArray = []
  devices.forEach((device) => {
    if (device.attrs) {
      device.attrs.forEach((attribute) => {
        const requestString = `/history/device/${device.deviceID}/history?attr=${attribute}${queryStringParams ? `${queryStringParams}` : ''}`;
        const promiseHistory = axios(optionsAxios(UTIL.GET, requestString))
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
  devicesPromises
};
