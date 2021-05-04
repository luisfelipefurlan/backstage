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

const { graphql } = require('graphql');
const axios = require('axios');
const executableSchema = require('../../../app/graphql/Schema');
const testGetTemplate = require('./testCases/GetTemplate');
const testTemplatesHasImageFirmware = require('./testCases/TemplateHasImageFirmware');

jest.mock('axios');

afterEach(() => {
  axios.mockReset();
});

describe('Schema', () => {
  // Array of case types
  const cases = [testGetTemplate, testTemplatesHasImageFirmware];

  cases.forEach(async (obj) => {
    const {
      id, query, variables, context, expected,
    } = obj;

    test(`query: ${id}`, async () => {
      await obj.beforeTest();
      const result = await graphql(executableSchema, query, null, context, variables);
      return expect(result).toEqual(expected);
    });
  });
});
