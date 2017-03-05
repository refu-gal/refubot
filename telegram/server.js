// Env vars
require('dotenv').config({path: __dirname + './.env'});

// Dependencies
const TelegramBot = require('node-telegram-bot-api');
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181';
const KAFKA_OUT_TOPIC = process.env.KAFKA_OUT_TOPIC || 'telegram_out';
const KAFKA_IN_TOPIC = process.env.KAFKA_IN_TOPIC || 'telegram_in';
const KAFKA_LIST_TOPIC = process.env.KAFKA_LIST_TOPIC || 'topic_list';

// Bot options
const options = {
  polling: true,
};

// Initialize the bot
const bot = new TelegramBot(TOKEN, options);

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  producer.createTopics([
    KAFKA_OUT_TOPIC,
    KAFKA_IN_TOPIC,
    KAFKA_LIST_TOPIC,
  ], (err, data) => {
    if (err) console.error(err);
    startBot();
  });
});

const startBot = () => {
  console.info('Starting bot...');

  // Handle messages
  bot.onText(/.*/, (msg) => {
    // Send message to the kafka in topic
    producer.send([
      {
        topic: KAFKA_IN_TOPIC,
        messages: [JSON.stringify({
          id: msg.chat.id,
          type: 'telegram',
          message: msg.text,
        })],
      },
    ], errorHandler);
  });

  // Handle messages coming from kafka "telegram_out" topic
  const consumer = new kafka.Consumer(client, [{
    topic: KAFKA_OUT_TOPIC,
  }]);
  consumer.on('message', (message) => {
    const data = JSON.parse(message.value);
    if (data.id) {
      bot.sendMessage(data.id, data.message, {
        parse_mode: 'markdown',
      });
    }
  });

  // Error handler for the bot
  const errorHandler = (err) => {
    if (err) {
      console.error(err);
      bot.sendMessage('😞 Lo siento pero estoy teninendo problemas para contactar con el servidor.');
    }
  };
};
