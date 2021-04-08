const _ = require('lodash');
const axios = require('axios');
const UTIL = require('../utils/AxiosUtils');
const moment = require('moment');

const operations = Object.freeze({
  LAST: {
    MOUTHS: 4,
    DAYS: 3,
    HOURS: 2,
    MINUTES: 1,
    N: 0,
  },
  MAP: 8,
});
const sources = Object.freeze({
  DEVICE: 0,
  TEMPLATE: 1,
});

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
    case 'boolean':
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

const generateTemplateKey = (deviceDictionary, device, attr) => {
  if (!_.isEmpty(deviceDictionary) && deviceDictionary[device]) {
    return deviceDictionary[device][attr] ? `${deviceDictionary[device][attr]}${attr}` : undefined;
  }
  return undefined;
}

const formatOutPut = (dynamicAttributes, staticAttributes, dojotDevices, deviceDictionary, operationType) => {
  const history = [];
  const historyObj = {};
  dynamicAttributes.forEach(({attr, device_id, value, ts}) => {
    if (operationType === operations.MAP) {
      historyObj[`${device_id}${attr}`] = {
        value: parseGeo(value),
        timestamp: moment(ts).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        deviceLabel: dojotDevices[device_id] ? dojotDevices[device_id].label : 'undefined',
        templateKey: generateTemplateKey(deviceDictionary, device_id, attr),
      }
    } else {
      history.push({
        [`${device_id}${attr}`]: isNaN(value) ? value : parseFloat(value),
        timestamp: moment(ts).utc().format("YYYY-MM-DDTHH:mm:ss[Z]"),
      });
    }
  });

  if (operationType === operations.MAP) {
    Object.values(staticAttributes).forEach(({deviceID, deviceLabel, ...otherProps}) => {
      Object.values(otherProps).forEach(({static_value, created, label}) => {
        historyObj[`${deviceID}${label}`] = {
          value: parseGeo(static_value),
          timestamp: moment(created).utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
          deviceLabel: deviceLabel,
          templateKey: generateTemplateKey(deviceDictionary, deviceID, label),
        }
      })
    })
  }

  return {history, historyObj}
};

const getDevices = async (devicesIds, options) => {
  const promises = [];
  const values = {};
  devicesIds.forEach(deviceId => {
    const requestString = `/device/${deviceId}`;
    const promise = axios(options(UTIL.GET, requestString)).then((response) => {
      if (!!response.data) {
        const {data: {attrs, created, id, label, templates}} = response;
        values[id] = {attrs, created, id, label, templates, templateID: null}
      }
    }).catch(() => Promise.resolve(null));
    promises.push(promise);
  })

  await (Promise.all(promises));
  return values;
}
const getDevicesByTemplate = async (requestedTemplates, options) => {
  const promises = [];
  const values = {};
  const devicesIDs = [];
  let deviceDictionary = {};
  Object.values(requestedTemplates).forEach(({templateID, dynamicAttrs, staticAttrs}) => {
    const requestString = `/device/template/${templateID}`;
    const promise = axios(options(UTIL.GET, requestString)).then((response) => {
      if (!!response.data) {
        const {data: {devices = []}, config: {url}} = response;
        const templateId = url.split("/").pop()
        devices.forEach(device => {
          const {id, label, created, attrs, templates} = device;
          if (!deviceDictionary[id]) {
            deviceDictionary[id] = {};
          }
          dynamicAttrs.forEach(attribute => {
            if (!deviceDictionary[id][attribute]) {
              deviceDictionary[id][attribute] = templateId;
            }
          })
          staticAttrs.forEach(attribute => {
            if (!deviceDictionary[id][attribute]) {
              deviceDictionary[id][attribute] = templateId;
            }
          })

          devicesIDs.push({deviceID: id, dynamicAttrs, staticAttrs});
          values[id] = {attrs, created, id, label, templates}
        })
      }
    }).catch(() => Promise.resolve(null));
    promises.push(promise);
  })
  await (Promise.all(promises));
  return {values, devicesIDs, deviceDictionary};
}

const getHistory = async (devices, options, queryString) => {
  const promises = [];
  const attributes = [];
  devices.forEach(({deviceID, dynamicAttrs}) => {
    if (dynamicAttrs) {
      dynamicAttrs.forEach((attribute) => {
        const requestString = `/history/device/${deviceID}/history?attr=${attribute}${queryString ? `${queryString}` : ''}`;
        const promise = axios(options(UTIL.GET, requestString)).then((response) => {
          if (!!response.data && Array.isArray(response.data)) {
            attributes.push(...response.data)
          }
        }).catch(() => Promise.resolve(null));
        promises.push(promise);
      })
    }
  })
  await (Promise.all(promises));
  return attributes;
}

const getStaticAttributes = (dojotDevices, requestedDevices) => {
  const auxStaticAttrs = {};
  requestedDevices.forEach(({deviceID, staticAttrs = []}) => {
    for (const template in dojotDevices[deviceID].attrs) {
      if (dojotDevices[deviceID].attrs.hasOwnProperty(template)) {
        dojotDevices[deviceID].attrs[template].forEach(attribute => {
            if (attribute.type === 'static' && staticAttrs.includes(attribute.label)) {
              if (!auxStaticAttrs[deviceID]) {
                auxStaticAttrs[deviceID] = {deviceID, deviceLabel: dojotDevices[deviceID].label}
              }
              auxStaticAttrs[deviceID][attribute.id] = {...attribute, templateID: template}
            }
          }
        )
      }
    }
  })

  return auxStaticAttrs;
}

module.exports = {
  reduceList,
  convertList,
  formatValueType,
  parseGeo,
  formatOutPut,
  getDevices,
  getHistory,
  getStaticAttributes,
  getDevicesByTemplate,
  operations,
  sources
};
