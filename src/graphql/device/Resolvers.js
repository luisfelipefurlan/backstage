const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const UTIL = require('../utils/AxiosUtils');
const LOG = require('../../utils/Log');
const {
  reduceList,
  convertList,
  formatValueType,
  formatOutPut,
  getDevices,
  getHistory,
  getStaticAttributes,
  getDevicesByTemplate,
  operations,
  sources
} = require('./Helpers');

const paramsAxios = {
  token: null,
};
const setToken = ((token) => {
  paramsAxios.token = token;
});
const optionsAxios = ((method, url) => UTIL.optionsAxios(method, url, paramsAxios.token));

const Resolvers = {
  Query: {
    async getDeviceById(root, { deviceId }, context) {
      setToken(context.token);
      const device = {};

      try {
        const { data: deviceData } = await axios(optionsAxios(UTIL.GET, `/device/${ deviceId }`));
        device.id = deviceData.id;
        device.label = deviceData.label;
        device.attrs = [];
        Object.keys(deviceData.attrs).forEach((key) => {
          deviceData.attrs[key].forEach((attr) => {
            if( attr.type !== 'dynamic' ) {
              return;
            }
            device.attrs.push({
              label: attr.label,
              valueType: formatValueType(attr.value_type),
            });
          });
        });
        return (device);
      } catch( error ) {
        LOG.error(error.stack || error);
        throw error;
      }
    },

    async getDevices(root, params, context) {
      setToken(context.token);
      // building the request string
      try {
        const requestParameters = {};

        if( params.page ) {
          if( params.page.size ) {
            requestParameters.page_size = params.page.size;
          } else {
            requestParameters.page_size = 20;
          }
          if( params.page.number ) {
            requestParameters.page_num = params.page.number;
          } else {
            requestParameters.page_num = 1;
          }
        }

        if( params.filter ) {
          if( params.filter.label ) {
            requestParameters.label = params.filter.label;
          }
        }

        requestParameters.sortBy = params.sortBy || 'label';

        let requestString = '/device?';
        const keys = Object.keys(requestParameters);
        const last = keys[keys.length - 1];
        keys.forEach((element) => {
          if( element === last ) {
            requestString += `${ element }=${ requestParameters[element] }`;
          } else {
            requestString += `${ element }=${ requestParameters[element] }&`;
          }
        });

        const { data: fetchedData } = await axios(optionsAxios(UTIL.GET, requestString));
        const devices = [];

        fetchedData.devices.forEach((device) => {
          const attributes = [];
          if( device.attrs ) {
            Object.keys(device.attrs).forEach((key) => {
              device.attrs[key].forEach((attr) => {
                if( attr.type !== 'dynamic' && attr.value_type !== 'geo:point' ) {
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

        return ({
          totalPages: fetchedData.pagination.total,
          currentPage: fetchedData.pagination.page,
          devices,
        });
      } catch( error ) {
        LOG.error(error.stack || error);
        throw error;
      }
    },

    async getDeviceHistoryForDashboard(
      root,
      props,
      context,
    ) {
      setToken(context.token);
      const {
        filter: { dateFrom = '', dateTo = '', lastN = '', devices = [], templates = [] },
        configs: { sourceType = sources.DEVICE, operationType = operations.LAST.N }
      } = props;
      let sortedHistory = [];
      let queryStringParams = '';
      let dynamicAttrs = [];
      let staticAttrs = [];
      let dojotDevices = {};
      let devicesFromTemplate = [];
      let deviceDictionary = {};

      switch( operationType ) {
        case operations.MAP:
        case operations.LAST.N:
          // To get the latest N records
          queryStringParams += `${ lastN && `&lastN=${ lastN }` }`;
          break;
        case operations.LAST.MINUTES:
          // To get the data for the last minutes
          queryStringParams += `&dateFrom=${ moment().subtract(lastN, 'minute').toISOString() }`;
          break;
        case operations.LAST.HOURS:
          // To get the data for the last hours
          queryStringParams += `&dateFrom=${ moment().subtract(lastN, 'hour').toISOString() }`;
          break;
        case operations.LAST.DAYS:
          // To get the data for the last days
          queryStringParams += `&dateFrom=${ moment().subtract(lastN, 'days').toISOString() }`;
          break;
        case operations.LAST.MOUTHS:
          // To get the data for the last months
          queryStringParams += `&dateFrom=${ moment().subtract(lastN, 'month').toISOString() }`;
          break;
        default:
          // Standard option is to get data by time window
          queryStringParams = `${ dateFrom && `&dateFrom=${ dateFrom }` }${ dateTo && `&dateTo=${ dateTo }` }`;
          break;
      }
      try {
        switch( sourceType ) {
          case sources.DEVICE:
            const devicesIds = devices.map(device => device.deviceID)
            dojotDevices = await getDevices(devicesIds, optionsAxios)
            dynamicAttrs = await getHistory(devices, optionsAxios, queryStringParams)
            break;
          case sources.TEMPLATE:
            const ret = await getDevicesByTemplate(templates, optionsAxios)
            dojotDevices = ret.values;
            devicesFromTemplate = ret.devicesIDs;
            deviceDictionary = ret.deviceDictionary;
            dynamicAttrs = await getHistory(devicesFromTemplate, optionsAxios, queryStringParams)
            break;
          default:
            dojotDevices = {}
            break;
        }

        if( operationType === operations.MAP ) {
          if( sourceType === sources.DEVICE ) {
            staticAttrs = getStaticAttributes(dojotDevices, devices)
          }
          if( sourceType === sources.TEMPLATE ) {
            staticAttrs = getStaticAttributes(dojotDevices, devicesFromTemplate)
          }
        }
      } catch( error ) {
        LOG.error(error.stack || error);
        throw error;
      }

      const { history, historyObj } = formatOutPut(dynamicAttrs, staticAttrs, dojotDevices, deviceDictionary, operationType);

      if( operationType === operations.MAP ) {
        return JSON.stringify(historyObj);
      }

      sortedHistory = _.orderBy(history, o => moment(o.timestamp).format('YYYYMMDDHHmmss'), ['asc']);

      return JSON.stringify(reduceList(convertList(sortedHistory)));
    },
  },
};


module.exports = Resolvers;
