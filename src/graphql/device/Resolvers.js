const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const UTIL = require('../utils/AxiosUtils');
const LOG = require('../../utils/Log');
const CacheService = require('../../utils/cache');
const {
  reduceList,
  convertList,
  formatValueType,
  resolveDeviceAttributes,
  formatOutPut,
  devicesPromises,
  operations
} = require('./Helpers');

const ttl = 60 * 60 * 1; //cache com duração de 1h
const cache = new CacheService(ttl); // Cria uma instancia de cache
const devicesCache = new CacheService(ttl); // Cria uma instancia de cache

const paramsAxios = {
  token: null,
};
const setToken = ((token) => {
  paramsAxios.token = token;
});
const optionsAxios = ((method, url) => UTIL.optionsAxios(method, url, paramsAxios.token));

const Resolvers = {
  Query: {
    async getDeviceById(root, {deviceId}, context) {
      setToken(context.token);
      const device = {};

      try {
        const {data: deviceData} = await axios(optionsAxios(UTIL.GET, `/device/${deviceId}`));
        device.id = deviceData.id;
        device.label = deviceData.label;
        device.attrs = [];
        Object.keys(deviceData.attrs).forEach((key) => {
          deviceData.attrs[key].forEach((attr) => {
            if (attr.type !== 'dynamic') {
              return;
            }
            device.attrs.push({
              label: attr.label,
              valueType: formatValueType(attr.value_type),
            });
          });
        });
        return (device);
      } catch (error) {
        LOG.error(error.stack || error);
        throw error;
      }
    },

    async getDevices(root, params, context) {
      setToken(context.token);
      // building the request string
      try {
        const requestParameters = {};

        if (params.page) {
          if (params.page.size) {
            requestParameters.page_size = params.page.size;
          } else {
            requestParameters.page_size = 20;
          }
          if (params.page.number) {
            requestParameters.page_num = params.page.number;
          } else {
            requestParameters.page_num = 1;
          }
        }

        if (params.filter) {
          if (params.filter.label) {
            requestParameters.label = params.filter.label;
          }
        }

        requestParameters.sortBy = params.sortBy || 'label';

        let requestString = '/device?';
        const keys = Object.keys(requestParameters);
        const last = keys[keys.length - 1];
        keys.forEach((element) => {
          if (element === last) {
            requestString += `${element}=${requestParameters[element]}`;
          } else {
            requestString += `${element}=${requestParameters[element]}&`;
          }
        });

        // const {data: fetchedData} = await axios(optionsAxios(UTIL.GET, requestString));
        const {data: fetchedData} = await cache.get(requestString, () => axios(optionsAxios(UTIL.GET, requestString)));
        const devices = [];

        fetchedData.devices.forEach((device) => {
          const attributes = [];
          if (device.attrs) {
            Object.keys(device.attrs).forEach((key) => {
              device.attrs[key].forEach((attr) => {
                if (attr.type !== 'dynamic' && attr.value_type !== 'geo:point') {
                  return;
                }
                attributes.push({
                  label: attr.label,
                  valueType: formatValueType(attr.value_type),
                  isDynamic: attr.type === 'dynamic',
                  staticValue: attr.static_value,
                });
              });
            });
          }
          devices.push({
            id: device.id,
            label: device.label,
            attrs: attributes,
          });
        });

        const deviceList = ({
          totalPages: fetchedData.pagination.total,
          currentPage: fetchedData.pagination.page,
          devices,
        });

        return deviceList;
      } catch (error) {
        LOG.error(error.stack || error);
        throw error;
      }
    },

    async getDeviceHistory(
      root,
      {
        filter: {
          dateFrom = '', dateTo = '', lastN = '', devices = [],
        },
      },
      context,
    ) {
      setToken(context.token);
      const history = [];
      const historyPromiseArray = [];
      const devicePromiseArray = [];
      const devicesInfo = [];

      try {
        const queryStringParams = `${dateFrom && `dateFrom=${dateFrom}&`}${dateTo && `dateTo=${dateTo}&`}${lastN && `lastN=${lastN}&`}`;

        devices.forEach((device) => {
          if (device.attrs) {
            device.attrs.forEach((attribute) => {
              let requestString = `/history/device/${device.deviceID}/history?attr=${attribute}`;
              if (queryStringParams) {
                requestString += `&${queryStringParams}`;
              }
              const promiseHistory = axios(optionsAxios(UTIL.GET, requestString))
                .catch(() => Promise.resolve(null));
              historyPromiseArray.push(promiseHistory);
            });
          }
          devicePromiseArray.push(axios(optionsAxios(UTIL.GET, `/device/${device.deviceID}`)));
        });

        // Contains the list of attribute values
        const fetchedData = await resolveDeviceAttributes(historyPromiseArray);

        // Contains a list of device details
        await Promise.all(devicePromiseArray).then((device) => {
          Object.keys(device).forEach((keys) => {
            if (!!device[keys] && !!device[keys].data) {
              devicesInfo.push(device[keys].data);
            }
          });
        }).catch((error) => {
          LOG.error(error.stack || error);
          throw error;
        });

        devicesInfo.forEach((deviceObj) => {
          if (!deviceObj || !deviceObj.attrs) {
            return;
          }
          // listing device attributes so a  reading's value type can be defined
          const deviceAttributes = {};
          Object.keys(deviceObj.attrs).forEach((key) => {
            deviceObj.attrs[key].forEach((attr) => {
              deviceAttributes[attr.label] = {
                label: attr.label,
                valueType: formatValueType(attr.value_type),
              };
            });
          });

          const readings = [];
          fetchedData.forEach((data) => {
            if (deviceObj.id === data.device_id) {
              readings.push({
                label: data.attr,
                valueType: deviceAttributes[data.attr].valueType,
                value: data.value,
                timestamp: data.ts,
              });
            }
          });

          if (readings.length) {
            history.push({
              deviceID: deviceObj.id,
              label: deviceObj.label,
              attrs: readings,
            });
          }
        });
      } catch (error) {
        LOG.error(error.stack || error);
        throw error;
      }

      return history;
    },

    async getDeviceHistoryForDashboard(
      root,
      {
        filter: {
          dateFrom = '', dateTo = '', lastN = '', operationType = 0, devices = [], templates = [],
        },
      },
      context,
    ) {
      setToken(context.token);
      let sortedHistory = [];
      let queryStringParams = '';
      let fetchedData;
      let historyPromiseArray = [];
      let auxStaticAttrs = [];
      switch (operationType) {
        case operations.TEMPLATES:
        case operations.CSMAP:
        case operations.MAP:
        case operations.LAST.N:
          // To get the latest N records
          queryStringParams += `${lastN && `&lastN=${lastN}`}`;
          break;
        case operations.LAST.MINUTES:
          // To get the data for the last minutes
          queryStringParams += `&dateFrom=${moment().subtract(lastN, 'minute').toISOString()}`;
          break;
        case operations.LAST.HOURS:
          // To get the data for the last hours
          queryStringParams += `&dateFrom=${moment().subtract(lastN, 'hour').toISOString()}`;
          break;
        case operations.LAST.DAYS:
          // To get the data for the last days
          queryStringParams += `&dateFrom=${moment().subtract(lastN, 'days').toISOString()}`;
          break;
        case operations.LAST.MOUTHS:
          // To get the data for the last months
          queryStringParams += `&dateFrom=${moment().subtract(lastN, 'month').toISOString()}`;
          break;
        default:
          // Standard option is to get data by time window
          queryStringParams = `${dateFrom && `&dateFrom=${dateFrom}`}${dateTo && `&dateTo=${dateTo}`}`;
          break;
      }

      let auxDevices = [];
      try {
        if (operationType === operations.TEMPLATES || operationType === operations.CSMAP) {
          // TODO: multiples templates
          const {templateID, attrs = [], staticAttrs = []} = templates[0];
          const requestString = `/device?page_size=999&page_num=1&template=${templateID}`;
          // const {data: fetchedDv} = await axios(optionsAxios(UTIL.GET, requestString));
          const {data: fetchedDv} = await cache.get(requestString, () => axios(optionsAxios(UTIL.GET, requestString)));
          fetchedDv.devices.forEach((device) => {
            auxDevices.push({deviceID: device.id, attrs})
            device.attrs[templateID].forEach(attribute => {
              if (attribute.type === 'static' && staticAttrs.includes(attribute.label)) {
                auxStaticAttrs.push({...attribute, deviceID: device.id, deviceLabel: device.label})
              }
            })
          })
        } else {
          auxDevices = devices;
        }
      } catch (error) {
        LOG.error(error.stack || error);
        throw error;
      }

      try {
        historyPromiseArray = devicesPromises(auxDevices, queryStringParams, optionsAxios);

        fetchedData = await resolveDeviceAttributes(historyPromiseArray);
      } catch (error) {
        LOG.error(error.stack || error);
        throw error;
      }

      const {history, historyObj} = formatOutPut(fetchedData, operationType, auxStaticAttrs);

      sortedHistory = _.orderBy(history, o => moment(o.timestamp).format('YYYYMMDDHHmmss'), ['asc']);

      if (operationType === operations.MAP) {
        return JSON.stringify(historyObj);
      }

      if (operationType === operations.CSMAP) {
        return JSON.stringify(historyObj);
      }

      return JSON.stringify(reduceList(convertList(sortedHistory)));
    },
  },
};


module.exports = Resolvers;
