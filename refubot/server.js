// Dependencies
const kafka = require('kafka-node');

// Bot token
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181';
const services = {
  telegram: {
    topics: {
      in: 'telegram_in',
      out: 'telegram_out',
    },
  },
  facebook: {
    topics: {
      in: 'facebook_in',
      out: 'facebook_out',
    },
  },
};

// Initialize kafka
const client = new kafka.Client(KAFKA_ADDRESS);
const producer = new kafka.Producer(client);

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('refubot.db');


producer.on('ready', () => {
  let topics = [];
  for (const key in services) {
    if (!services.hasOwnProperty(key)) continue;
    const service = services[key];
    topics.push(service.topics.in);
  }

  producer.createTopics(topics, (err, data) => {
    if (err) console.error(err);
    startBot();
  });
});

const startBot = () => {
  console.info('Starting bot...');
  console.info('Starting bot...');
  db.run('CREATE TABLE if not exists register (platform TEXT, platformId TEXT, topic TEXT)');

  const getRegisteredOnTopic = (topic, callback) => {
    db.all(`SELECT * from register where topic = '${topic}'`, (err, rows) => {
      if (err) errorHandler(err);
      callback(rows);
   });
 };

  const registerInTopic = (platform, platformId, topic) => {
    db.run(`INSERT OR REPLACE INTO register(platform, platformId, topic) VALUES ('${platform}', '${platformId}', '${topic}')`);
  };

  let topics = [];
  for (const key in services) {
    if (!services.hasOwnProperty(key)) continue;
    const service = services[key];
    topics.push({topic: service.topics.in});
  }

  // Handle messages coming from kafka service in topic
  const consumer = new kafka.Consumer(client, topics);
  console.log('Listening to ' + topics);
  consumer.on('message', (message) => {
    const data = JSON.parse(message.value);

    // Methods

    // Register
    if (/estoy en (.*)/.test(data.message)) {
      const matches = data.message.match(/estoy en (.*)/);
      const channel = matches[1].toLowerCase();

      // Register in topic on the BD
      registerInTopic(data.type, data.id, channel);

      // Send message to the kafka in topic
      return producer.send([
        {
          topic: services[data.type].topics.out,
          messages: [JSON.stringify({
            id: data.id,
            message: 'Te has subscrito para recibir información de ' + channel,
          })],
        },
      ], errorHandler);
    }

    if (/(.*) en (.*)/.test(data.message)) {
      const matches = data.message.match(/(.*) en (.*)/);
      const channel = matches[2].toLowerCase();

      return getRegisteredOnTopic(channel, (recipients) => {
        recipients.map((recipient) => {
          producer.send([
            {
              topic: services[recipient.platform].topics.out,
              messages: [JSON.stringify({
                id: recipient.platformId,
                message: matches[1],
              })],
            },
          ], errorHandler);
        });
      });
    };

    return errorHandler('Method not found');
  });

  // Error handler for the bot
  const errorHandler = (err) => {
    if (err) console.error(err);
  };
};
