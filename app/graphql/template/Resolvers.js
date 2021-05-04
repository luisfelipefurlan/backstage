const axios = require('axios');
const {
  Logger,
} = require('@dojot/microservice-sdk');
const UTIL = require('../utils/AxiosUtils');

const logger = new Logger('backstage:graphql/template/Resolvers');

const { formatValueType } = require('../device/Helpers');

const params = {
  token: null,
};
const setToken = ((token) => {
  params.token = token;
});
const optionsAxios = ((method, url) => UTIL.optionsAxios(method, url, params.token));

const reservedLabelImg = ['dojot:firmware_update:desired_version', 'dojot:firmware_update:version', 'dojot:firmware_update:update', 'dojot:firmware_update:update_result', 'dojot:firmware_update:state'];
const hasReservedLabelImg = ((attr) => {
  if (attr.metadata && attr.metadata.length > 0) {
    if (attr.metadata.find((meta) => reservedLabelImg.includes(meta.label))) {
      return true;
    }
  }
  return false;
});

const Resolvers = {
  Query: {
    /**
     * Get one template by id
     * @param root
     * @param id
     * @param context
     * @returns {Promise<*>}
     */
    async template(root, { id }, context) {
      setToken(context.token);

      const { data: templateData } = await axios(optionsAxios(UTIL.GET, `/template/${id}`));
      const attrImg = [];

      function cleanNullMetadataToEmpty(attrs) {
        attrs.map((attr) => {
          if (!attr.metadata) {
            const attrAux = attr;
            attrAux.metadata = [];
            return attrAux;
          }
          return attr;
        });
      }

      if (templateData) {
        let { attrs, config_attrs: configAttrs, data_attrs: dataAttrs } = templateData;
        if (attrs) {
          attrs = attrs.filter((attr) => {
            if (hasReservedLabelImg(attr)) {
              attrImg.push(attr);
              return false;
            }
            return true;
          });
          cleanNullMetadataToEmpty(attrs);
          cleanNullMetadataToEmpty(attrImg);
        }
        if (configAttrs) {
          configAttrs = configAttrs.filter((attr) => !hasReservedLabelImg(attr));
          cleanNullMetadataToEmpty(configAttrs);
        }

        if (dataAttrs) {
          dataAttrs = dataAttrs.filter((attr) => !hasReservedLabelImg(attr));
          cleanNullMetadataToEmpty(dataAttrs);
        }

        return {
          ...templateData,
          img_attrs: attrImg,
          config_attrs: configAttrs,
          data_attrs: dataAttrs,
          attrs,
        };
      }
      return {};
    },

    /**
     * Checks if templates has Image Firmware and return a array
     * with objects key-value, where key is a id template and value is a boolean.
     * The value is true if the template has image firmware.
     * @param root
     * @param templatesId
     * @param context
     * @returns {Promise<Array>}
     */
    async templatesHasImageFirmware(root, { templatesId }, context) {
      setToken(context.token);
      const map = [];
      const promises = [];
      templatesId.forEach((id) => {
        const promise = axios(optionsAxios(UTIL.GET, `/template/${id}`)).then((res) => {
          const { data } = res;
          const { attrs } = data;

          // count number of reserved label, grouping by label
          const mapExistAllReserved = new Map();
          if (attrs) {
            attrs.forEach((attr) => {
              if (attr.metadata && attr.metadata.length > 0) {
                attr.metadata.forEach((meta) => {
                  if (reservedLabelImg.includes(meta.label)) {
                    mapExistAllReserved.set(meta.label, true);
                  }
                });
              }
            });

            // if the template has all reservedLabelImg, then the template is for ImageFirmware
            const hasImageFirmware = mapExistAllReserved.size === reservedLabelImg.length;
            map.push({ key: `${id}`, value: `${hasImageFirmware}` });
          }
        }).catch((e) => {
          logger.error(e);
        });
        promises.push(promise);
      });

      await Promise.all(promises);
      return map;
    },

    async getTemplates(root, { page }, context) {
      setToken(context.token);
      let requestString = '/template?';

      if (page) {
        requestString += `page_size=${page.size || 20}&page_num=${page.number || 1}&sortBy=label`;
      }

      const { data: fetchedData } = await axios(optionsAxios(UTIL.GET, requestString));
      const templates = [];
      fetchedData.templates.forEach((template) => {
        const attributes = [];
        if (template.attrs) {
          template.attrs.forEach((attr) => {
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
        }
        templates.push({
          id: template.id,
          label: template.label,
          attrs: attributes,
        });
      });

      return ({
        totalPages: fetchedData.pagination.total,
        currentPage: fetchedData.pagination.page,
        templates,
      });
    },
  },

};

module.exports = Resolvers;
