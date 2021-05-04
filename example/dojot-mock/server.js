/* eslint-disable no-console */
const express = require('express');
const mocks = require('./mock');

const app = express();

app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));

try {
  app.get('/device', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify(mocks.devices));
  });

  app.post('/device', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.body.label && req.body.templates) {
      res.status(200).end(JSON.stringify({
        devices: [
          {
            id: '12345',
            label: req.body.label,
          }],
      }));
    } else {
      res.status(400).end(JSON.stringify({
        message: 'Bad Request',
        status: 400,
      }));
    }
  });

  app.get('/device/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.params.id === 'ab00f6') {
      res.status(200).end(JSON.stringify(mocks.device1));
    } else if (req.params.id === '47f6e0') {
      res.status(200).end(JSON.stringify(mocks.device2));
    } else {
      res.sendStatus(404);
    }
  });

  app.get('/device/template/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.params.id === '1') {
      res.status(200).end(JSON.stringify(mocks.devicesInTemplate));
    } else {
      res.sendStatus(404);
    }
  });

  app.get('/template/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.params.id === '1') {
      res.status(200).end(JSON.stringify(mocks.template));
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/template', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.body.label && req.body.attrs) {
      res.status(200).end(JSON.stringify({
        result: 'ok',
        template: {
          attrs: [{
            created: '2021-04-28T20:30:34.617676+00:00',
            id: 38,
            label: 'fan',
            template_id: '1',
            type: 'actuator',
            value_type: 'float',
          }, {
            created: '2021-04-28T20:30:34.617198+00:00',
            id: 37,
            label: 'temperature',
            template_id: '1',
            type: 'dynamic',
            value_type: 'float',
          }],
          config_attrs: [],
          created: '2021-04-28T20:30:34.616413+00:00',
          data_attrs: [{
            created: '2021-04-28T20:30:34.617676+00:00',
            id: 38,
            label: 'fan',
            template_id: '1',
            type: 'actuator',
            value_type: 'float',
          }, {
            created: '2021-04-28T20:30:34.617198+00:00',
            id: 37,
            label: 'temperature',
            template_id: '1',
            type: 'dynamic',
            value_type: 'float',
          }],
          id: 1,
          label: req.body.label,
        },
      }));
    } else {
      res.status(400).end(JSON.stringify({
        message: 'Bad Request',
        status: 400,
      }));
    }
  });

  app.get('/history/device/:id/history', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.params.id === 'ab00f6' && req.query.attr === 'attrDyInt') {
      res.status(200).end(JSON.stringify(mocks.historyDevice1AttrDyInt));
    } else if (req.params.id === 'ab00f6' && req.query.attr === 'attrDyStr') {
      res.status(200).end(JSON.stringify(mocks.historyDevice1AttrDyStr));
    } else {
      res.sendStatus(404);
    }
  });

  app.listen(8888, () => {
    console.log('Server listen in 8888 \n');
  });
} catch (e) {
  console.error(e);
  process.kill(process.pid, 'SIGTERM');
}
