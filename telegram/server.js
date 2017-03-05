// Dependencies
const TelegramBot = require('node-telegram-bot-api');
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
//const TOKEN = process.env.TELEGRAM_TOKEN || '133673383:AAGVx28t9c19uqlqOA64Ss7NSEDTwf46YR4';
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181';
const KAFKA_OUT_TOPIC = process.env.KAFKA_OUT_TOPIC || 'telegram_out';
const KAFKA_IN_TOPIC = process.env.KAFKA_IN_TOPIC || 'telegram_in';
const KAFKA_SUBSCRIBERS_TOPIC = process.env.KAFKA_SUBSCRIBERS_TOPIC || 'subscribers';

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
    KAFKA_SUBSCRIBERS_TOPIC,
  ], (err, data) => {
    if (err) console.error(err);
    console.info('Topics created, waiting 5 seconds before start the bot');
    setTimeout(startBot, 5000);
  });
});

const startBot = () => {
  console.info('Starting bot...');

  // Default bot message options
  const messageOptions = {
    parse_mode: 'markdown',
  };

  // Handle register messages
  bot.onText(/^\/?(help|start)$/, (msg) => {
    // Send feedback to the user
    bot.sendMessage(msg.chat.id, '' +
      'Welcome, to @refubot:\n' +
      'You can control me by sending these *commands*:\n' +
      '/register *country* - register to a country channel to receive new alerts\n' +
      '/alarm *country* *message* - send a new alarm to a country channel\n' +
      '/help - show this help'
    , messageOptions);
  });

  // Handle register messages
  bot.onText(/^\/?register ([a-zA-Z0-9]*)$/, (msg, match) => {
    const channel = match[1].toLowerCase();

    producer.send([
      {
        topic: KAFKA_SUBSCRIBERS_TOPIC,
        messages: JSON.stringify({
          channel: channel,
          platform: 'telegram',
          id: msg.chat.id,
        }),
      },
    ], errorHandler);

    // Send feedback to the user
    bot.sendMessage(msg.chat.id, '👂 You\'re subscribed to *#' + channel +'* channel now!', messageOptions);
  });

  // Handle alarm messages
  bot.onText(/^\/?alarm ([a-zA-Z0-9]*) (.*)/, (msg, match) => {
    // Send feedback to the user
    bot.sendMessage(msg.chat.id, '👍 Thanks I\'ll comunicate that to other refugees!', messageOptions);

    // Send message to the kafka topic
    producer.send([
      {
        topic: KAFKA_IN_TOPIC,
        messages: JSON.stringify({
          id: msg.chat.id,
          channel: match[1],
          message: match[2],
        }),
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
      bot.sendMessage(data.id, '❗️ ' + data.message);
    }
  });

  // Error handler for the bot
  const errorHandler = (err) => {
    if (err) {
      console.error(err);
      bot.sendMessage('😞 Sorry I\'ve problems to talk with the server ');
    }
  };
};
