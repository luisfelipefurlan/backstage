const axios = require('axios');
const { templateId5 } = require('../mock/Template');

const testGetTemplate = {
  id: 'testGetTemplate',
  query: `
    query ($id: Int!) {
        template(id: $id) {
    label
    id
    created
    attrs {
      id
      label
      metadata{
        id
        label
        static_value
        type
        value_type
        created
        updated
      }
      static_value
      template_id
      type
      value_type
      created
    }
    config_attrs {
      id
      label
      metadata{
        id
        label
        static_value
        type
        value_type
        created
        updated
      }
      static_value
      template_id
      type
      value_type
      created
    }
    data_attrs {
      id
      label
      metadata{
        id
        label
        static_value
        type
        value_type
        created
        updated
      }
      static_value
      template_id
      type
      value_type
      created
    }
    img_attrs {
      id
      label
      metadata{
        id
        label
        static_value
        type
        value_type
        created
        updated
      }
      static_value
      template_id
      type
      value_type
      created
    }
  }
} 
  `,
  variables: { id: 5 },
  context: {},
  expected: {
    data: {
      template: {
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
      },
    },
  },
  beforeTest() {
    axios.mockImplementationOnce(() => Promise.resolve({ data: templateId5 }));
  },
};

module.exports = testGetTemplate;
