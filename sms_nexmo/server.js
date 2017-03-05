require('dotenv').config({path:__dirname + '/.env'});

var config = {
  API_KEY: process.env.API_KEY || '',
  API_SECRET: process.env.API_SECRET || '',
  FROM_NUMBER: process.env.FROM_NUMBER || '',
  TO_NUMBER: process.env.TO_NUMBER || '',
  APP_ID: process.env.APP_ID || '',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  DEBUG: process.env.DEBUG === 'true'
};

// Dependencies

const NexmoBot = require('nexmo');
const kafka = require('kafka-node');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Bot token
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181';
const KAFKA_OUT_TOPIC = process.env.KAFKA_OUT_TOPIC || 'sms_out';
const KAFKA_IN_TOPIC = process.env.KAFKA_IN_TOPIC || 'sms_in';
const KAFKA_LIST_TOPIC = process.env.KAFKA_LIST_TOPIC || 'topic_list';


// HTTP Server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3001, () => {
  console.log('Nexmo-sms server listening on port %d in %s mode', server.address().port, app.settings.env);
});

app.post('/inbound', (req, res) => {
  handleParams(req.body, res);
});

function handleParams(params, res) {
  if (!params.to || !params.msisdn) {
    console.log('This is not a valid inbound SMS message!');
  } else {
    console.log('Success');
    let incomingData = {
      messageId: params.messageId,
      from: params.msisdn,
      text: params.text,
      type: params.type,
      timestamp: params['message-timestamp']
    };
    res.send(incomingData);
  }
  res.status(200).end();
}

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

const startBot = () => {
  console.info('Starting bot...');

  // Handle messages coming from kafka "sms_out" topic
  const consumer = new kafka.Consumer(client, [{
    topic: KAFKA_OUT_TOPIC,
  }]);
  consumer.on('message', (message) => {
    const data = JSON.parse(message.value);
    console.log('Received message in sms_out');
  });

  // Error handler for the bot
  const errorHandler = (err) => {
    if (err) {
      console.error(err);
    }
  };
};