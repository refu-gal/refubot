// Dependencies
const kafka = require('kafka-node');

// Bot token
const TOKEN = process.env.TELEGRAM_TOKEN || '364419216:AAEe1tszpIxOWSLVDNXRs4_3GBUUqsocFCM';
//const TOKEN = process.env.TELEGRAM_TOKEN || '133673383:AAGVx28t9c19uqlqOA64Ss7NSEDTwf46YR4';

const KAFKA_OUT_TOPIC = process.env.KAFKA_OUT_TOPIC || 'telegram_out';
const KAFKA_IN_TOPIC = process.env.KAFKA_IN_TOPIC || 'telegram_in';
const KAFKA_LIST_TOPIC = process.env.KAFKA_LIST_TOPIC || 'topic_list';

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  producer.createTopics([
    KAFKA_LIST_TOPIC
  ], (err, data) => {
    if (err) console.error(err);
    console.info('Topics created, waiting 5 seconds before start the bot');
    setTimeout(startBot, 5000);
  });
});

const startBot = () => {
  console.info('Starting bot...');

  // Handle messages coming from kafka "telegram_out" topic
  const consumer = new kafka.Consumer(client, [{
    topic: KAFKA_IN_TOPIC,
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
