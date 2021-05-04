const axios = require('axios');

const mockConfig = {
  app: { 'internal.base.url': 'abc' },
};
const mockSdk = {
  ConfigManager: {
    getConfig: jest.fn(() => mockConfig),
    transformObjectKeys: jest.fn((obj) => obj),
  },
  ServiceStateManager:
      jest.fn().mockImplementation(() => ({
        registerService: jest.fn(),
      })),
  Logger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
};
jest.mock('@dojot/microservice-sdk', () => mockSdk);
jest.mock('axios');

const Resolvers = require('../../../../app/graphql/template/Resolvers');
const { templateId3, templateId4, templateId5 } = require('../mock/Template');

afterEach(() => {
  axios.mockReset();
});

it('templatesHasImageFirmware', () => {
  const obj = {};
  const args = { templatesId: [3, 4, 5] };
  const ctx = {};
  axios.mockImplementationOnce(() => Promise.resolve({ data: templateId3 }))
    .mockImplementationOnce(() => Promise.resolve({ data: templateId4 }))
    .mockImplementationOnce(() => Promise.resolve({ data: templateId5 }));

  return Resolvers.Query.templatesHasImageFirmware(obj, args, ctx)
    .then((output) => {
      expect((output)).toEqual(
        [
          {
            key: '3',
            value: 'false',
          },
          {
            key: '4',
            value: 'false',
          },
          {
            key: '5',
            value: 'true',
          },
        ],
      );
    });
});


it('get template', () => {
  const obj = {};
  const args = { id: 5 };
  const ctx = {};
  axios.mockImplementationOnce(() => Promise.resolve({ data: templateId5 }));

  return Resolvers.Query.template(obj, args, ctx)
    .then((output) => {
      expect((output)).toEqual({
        label: 'xxxxx',
        id: 5,
        created: '2019-02-14T16:36:43.066250+00:00',
        attrs: [],
        config_attrs: [],
        data_attrs: [],
        img_attrs: [
          {
            id: 26,
            label: 'desired_version',
            metadata: [
              {
                id: 32,
                label: 'dojot:firmware_update:desired_version',
                static_value: 'desired_version',
                type: 'desired_version',
                value_type: 'string',
                created: '2019-02-14T16:36:43.076620+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.071583+00:00',
          },
          {
            id: 21,
            label: 'sdfsdfsdf',
            metadata: [
              {
                id: 27,
                label: 'dojot:firmware_update:desired_version',
                static_value: 'desired_version',
                type: 'desired_version',
                value_type: 'string',
                created: '2019-02-14T16:36:43.073228+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.067457+00:00',
          },
          {
            id: 25,
            label: 'state',
            metadata: [
              {
                id: 31,
                label: 'dojot:firmware_update:state',
                static_value: 'state',
                type: 'state',
                value_type: 'string',
                created: '2019-02-14T16:36:43.076189+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.070909+00:00',
          },
          {
            id: 23,
            label: 'update',
            metadata: [
              {
                id: 29,
                label: 'dojot:firmware_update:update',
                static_value: 'update',
                type: 'update',
                value_type: 'string',
                created: '2019-02-14T16:36:43.075128+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.069348+00:00',
          },
          {
            id: 24,
            label: 'update_result',
            metadata: [
              {
                id: 30,
                label: 'dojot:firmware_update:update_result',
                static_value: 'update_result',
                type: 'update_result',
                value_type: 'string',
                created: '2019-02-14T16:36:43.075737+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.070091+00:00',
          },
          {
            id: 22,
            label: 'version',
            metadata: [
              {
                id: 28,
                label: 'dojot:firmware_update:version',
                static_value: 'version',
                type: 'version',
                value_type: 'string',
                created: '2019-02-14T16:36:43.074386+00:00',
                updated: null,
              },
            ],
            static_value: '',
            template_id: '5',
            type: 'dynamic',
            value_type: 'string',
            created: '2019-02-14T16:36:43.068578+00:00',
          },
        ],
      });
    });
});
