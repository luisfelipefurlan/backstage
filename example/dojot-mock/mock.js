const mock = {};

// /device 200 ok
mock.devices = {
  devices: [
    {
      attrs: {
        1: [
          {
            created: '2021-04-01T21:49:44.552504+00:00',
            id: 1,
            is_static_overridden: false,
            label: 'attrDyStr',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'string',
          },
          {
            created: '2021-04-01T21:49:44.554419+00:00',
            id: 2,
            is_static_overridden: false,
            label: 'attrDyInt',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'integer',
          },
        ],
      },
      created: '2021-04-01T21:59:16.783037+00:00',
      id: '47f6e0',
      label: 'DeviceMock2',
      templates: [
        1,
      ],
    },
    {
      attrs: {
        1: [
          {
            created: '2021-04-01T21:49:44.552504+00:00',
            id: 1,
            is_static_overridden: false,
            label: 'attrDyStr',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'string',
          },
          {
            created: '2021-04-01T21:49:44.554419+00:00',
            id: 2,
            is_static_overridden: false,
            label: 'attrDyInt',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'integer',
          },
        ],
      },
      created: '2021-04-01T21:49:57.688518+00:00',
      id: 'ab00f6',
      label: 'DeviceMock1',
      templates: [
        1,
      ],
    },
  ],
  pagination: {
    has_next: false,
    next_page: null,
    page: 1,
    total: 1,
  },
};

// /device/ab00f6 200 ok
mock.device1 = {
  attrs: {
    1: [
      {
        created: '2021-04-01T21:49:44.554419+00:00',
        id: 2,
        is_static_overridden: false,
        label: 'attrDyInt',
        static_value: '',
        template_id: '1',
        type: 'dynamic',
        value_type: 'integer',
      },
      {
        created: '2021-04-01T21:49:44.552504+00:00',
        id: 1,
        is_static_overridden: false,
        label: 'attrDyStr',
        static_value: '',
        template_id: '1',
        type: 'dynamic',
        value_type: 'string',
      },
    ],
  },
  created: '2021-04-01T21:49:57.688518+00:00',
  id: 'ab00f6',
  label: 'DeviceMock1',
  templates: [
    1,
  ],
};

// /device/47f6e0 200 ok
mock.device2 = {
  attrs: {
    1: [
      {
        created: '2021-04-01T21:49:44.554419+00:00',
        id: 2,
        is_static_overridden: false,
        label: 'attrDyInt',
        static_value: '',
        template_id: '1',
        type: 'dynamic',
        value_type: 'integer',
      },
      {
        created: '2021-04-01T21:49:44.552504+00:00',
        id: 1,
        is_static_overridden: false,
        label: 'attrDyStr',
        static_value: '',
        template_id: '1',
        type: 'dynamic',
        value_type: 'string',
      },
    ],
  },
  created: '2021-04-01T21:59:16.783037+00:00',
  id: '47f6e0',
  label: 'DeviceMock2',
  templates: [
    1,
  ],
};

//  /device/template/1 200 ok
mock.devicesInTemplate = {
  devices: [
    {
      attrs: {
        1: [
          {
            created: '2021-04-01T21:49:44.554419+00:00',
            id: 2,
            is_static_overridden: false,
            label: 'attrDyInt',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'integer',
          },
          {
            created: '2021-04-01T21:49:44.552504+00:00',
            id: 1,
            is_static_overridden: false,
            label: 'attrDyStr',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'string',
          },
        ],
      },
      created: '2021-04-01T21:49:57.688518+00:00',
      id: 'ab00f6',
      label: 'DeviceMock1',
      templates: [
        1,
      ],
    },
    {
      attrs: {
        1: [
          {
            created: '2021-04-01T21:49:44.554419+00:00',
            id: 2,
            is_static_overridden: false,
            label: 'attrDyInt',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'integer',
          },
          {
            created: '2021-04-01T21:49:44.552504+00:00',
            id: 1,
            is_static_overridden: false,
            label: 'attrDyStr',
            static_value: '',
            template_id: '1',
            type: 'dynamic',
            value_type: 'string',
          },
        ],
      },
      created: '2021-04-01T21:59:16.783037+00:00',
      id: '47f6e0',
      label: 'DeviceMock2',
      templates: [
        1,
      ],
    },
  ],
  pagination: {
    has_next: false,
    next_page: null,
    page: 1,
    total: 1,
  },
};

// template/1 200 ok
mock.template = {
  attrs: [
    {
      created: '2021-04-01T21:49:44.554419+00:00',
      id: 2,
      label: 'attrDyInt',
      static_value: '',
      template_id: '1',
      type: 'dynamic',
      value_type: 'integer',
    },
    {
      created: '2021-04-01T21:49:44.552504+00:00',
      id: 1,
      label: 'attrDyStr',
      static_value: '',
      template_id: '1',
      type: 'dynamic',
      value_type: 'string',
    },
  ],
  config_attrs: [],
  created: '2021-04-01T21:49:08.150940+00:00',
  data_attrs: [
    {
      created: '2021-04-01T21:49:44.554419+00:00',
      id: 2,
      label: 'attrDyInt',
      static_value: '',
      template_id: '1',
      type: 'dynamic',
      value_type: 'integer',
    },
    {
      created: '2021-04-01T21:49:44.552504+00:00',
      id: 1,
      label: 'attrDyStr',
      static_value: '',
      template_id: '1',
      type: 'dynamic',
      value_type: 'string',
    },
  ],
  id: 1,
  label: 'TemplateMock1',
  updated: '2021-04-01T21:49:44.550202+00:00',
};

// /history/device/ab00f6/history?attr=attrDyInt 200 ok
mock.historyDevice1AttrDyInt = [
  {
    attr: 'attrDyInt',
    value: 126,
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:44.355000Z',
    metadata: {},
  },
  {
    attr: 'attrDyInt',
    value: 125,
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:33.161000Z',
    metadata: {},
  },
  {
    attr: 'attrDyInt',
    value: 124,
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:25.863000Z',
    metadata: {},
  },
  {
    attr: 'attrDyInt',
    value: 123,
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:11.475000Z',
    metadata: {},
  },
];

// /history/device/ab00f6/history?attr=attrDyStr 200 ok
mock.historyDevice1AttrDyStr = [
  {
    attr: 'attrDyStr',
    value: 'text4',
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:44.355000Z',
    metadata: {},
  },
  {
    attr: 'attrDyStr',
    value: 'text3',
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:33.161000Z',
    metadata: {},
  },
  {
    attr: 'attrDyStr',
    value: 'text2',
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:25.863000Z',
    metadata: {},
  },
  {
    attr: 'attrDyStr',
    value: 'text',
    device_id: 'ab00f6',
    ts: '2021-04-01T21:51:11.475000Z',
    metadata: {},
  },
];


module.exports = mock;
