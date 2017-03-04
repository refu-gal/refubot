// Dependencies
const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181'
const KAFKA_OUT_TOPIC = process.env.KAFKA_OUT_TOPIC || 'telegram_out'
const KAFKA_IN_TOPIC = process.env.KAFKA_IN_TOPIC || 'telegram_in'
const KAFKA_IDS_TOPIC = process.env.KAFKA_IDS_TOPIC || 'telegram_ids'

// Bot options
const options = {
  polling: true
};

// Initialize the bot
const bot = new TelegramBot(TOKEN, options);

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const idsClient = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  // Create topics
  producer.createTopics([
    KAFKA_IDS_TOPIC,
    KAFKA_IN_TOPIC,
    KAFKA_OUT_TOPIC,
  ], false, (err, data) => {
    if (err) { console.error(err); }
    console.log('Creating kafka topics');
    console.log(data);
  })

  // Initialize chat ids
  let chatids = [];

  // Handle register messages
  bot.onText(/register/, (msg) => {
    // Send the id to the kafka topic
    producer.send([
      {
        topic: KAFKA_IDS_TOPIC,
        messages: [msg.chat.id],
      },
    ], errorHandler);

    // Send feedback to the user
    bot.sendMessage(msg.chat.id, 'Welcome, you\'re in!!');
  });

  // Handle alarm messages
  bot.onText(/alarm (.*)/, (msg, match) => {
    // Send feedback to the user
    bot.sendMessage(msg.chat.id, 'Thanks I\'ll comunicate that to other people!');

    // Send message to the kafka topic
    producer.send([
      {
        topic: KAFKA_IN_TOPIC,
        messages: [ msg.chat.id + '@@@' + match[1] ],
      },
    ], errorHandler);
  });

  // Handle messages coming from kafka "telegram_out" topic
  const consumer = new kafka.Consumer(client, [
    {
      topic: KAFKA_IN_TOPIC,
    }
  ]);
  consumer.on('message', (message) => {
    const cid = message.value.split('@@@')[0]
    message = message.value.split('@@@')[1];

    let sentTo = 0;
    for (var x = 0; x < chatids.length; x++) {
      if (chatids[x] !== cid) {
        sentTo++;
        bot.sendMessage(chatids[x], message);
      }
    }

    bot.sendMessage(cid, 'You\'re message has been sent to ' + sentTo + ' refugees');
  });

  // Handle messages coming from kafka that register new chatids
  const idsConsumer = new kafka.Consumer(idsClient, [
    {
      topic: KAFKA_IDS_TOPIC,
      offset: 0,
      position: 0,
    }
  ], {
    autoCommit: true,
  });
  idsConsumer.on('message', (message) => {
    console.log('Registered new user');
    chatids.push(message.value);
  });

  // Error handler for the bot
  const errorHandler = (err) => {
    if (err) {
      console.error(err);
      bot.sendMessage('Sorry I\'ve problems to interact with the server');
    }
  }
});
