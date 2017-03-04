const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'localhost:2181'
const KAFKA_OUT_TOPIC = 'telegram_out'
const KAFKA_IN_TOPIC = 'telegram_in'

// Bot options
const options = {
  polling: true
};

// Initialize the bot
const bot = new TelegramBot(TOKEN, options);

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

// Handle alarm messages
bot.onText(/alarm (.*)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, 'Thanks I\'ll comunicate that to other people!');
  chatid = msg.chat.id;
  producer.send([
    {
      topic: KAFKA_IN_TOPIC,
      messages: [ match[1] ],
    }
  ], (err) => {
    if (err) {
      bot.sendMessage(msg.chat.id, 'Sorry I\'m having problems to talk with our server');
    }
  });
});

// Handle messages coming from kafka "telegram_out" topic
const consumer = new kafka.Consumer(client, [{
  topic: KAFKA_OUT_TOPIC,
}]);
consumer.on('message', (message) => {
  bot.sendMessage(chatid, message.value);
});
