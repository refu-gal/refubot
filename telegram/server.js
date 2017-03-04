const TelegramBot = require('node-telegram-bot-api');
const request = require('request');
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'localhost:2181'

// Bot options
const options = {
  polling: true
};

// Initialize the bot
const bot = new TelegramBot(TOKEN, options);

// Initialize kafka
const Producer = kafka.Producer;
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new Producer(client);

// On receive
bot.onText(/alarm (.*)/, (msg, match) => {
  bot.sendMessage(msg.chat.id, 'Thanks I\'ll comunicate that to other people!');
  producer.send([
    {
      topic: 'telegram_in',
      messages: [ match[1] ],
    }
  ], (err) => {
    console.log(err);
  });
});
