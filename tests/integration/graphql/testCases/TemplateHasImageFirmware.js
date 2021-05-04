const axios = require('axios');
const { templateId3, templateId4, templateId5 } = require('../mock/Template');

const testTemplatesHasImageFirmware = {
  id: 'templatesHasImageFirmware',
  query: `
    query ($templatesId: [Int]!) {
      templatesHasImageFirmware(templatesId: $templatesId) {
        key
        value
      }
    }
  `,
  variables: { templatesId: [3, 4, 5] },
  context: {},
  expected: {
    data: {
      templatesHasImageFirmware: [
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
    },
  },
  beforeTest() {
    axios.mockImplementationOnce(() => Promise.resolve({ data: templateId3 }))
      .mockImplementationOnce(() => Promise.resolve({ data: templateId4 }))
      .mockImplementationOnce(() => Promise.resolve({ data: templateId5 }));
  },
};

module.exports = testTemplatesHasImageFirmware;
