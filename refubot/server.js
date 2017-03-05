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
  sms: {
    topics: {
      in: 'sms_in',
      out: 'sms_out',
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

  db.run('CREATE TABLE if not exists register (platform TEXT, platformId TEXT, topic TEXT, PRIMARY KEY(platformId, topic))');

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
  consumer.on('message', (message) => {
    console.log(message);
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

    // Alarm
    if (/^(.*) (en|de) ([a-zA-Z0-9]*)$/.test(data.message)) {
      const matches = data.message.match(/^(.*) (en|de) ([a-zA-Z0-9]*)$/);
      const channel = matches[3].toLowerCase();

      return getRegisteredOnTopic(channel, (recipients) => {
        producer.send([
          {
            topic: services[data.type].topics.out,
            messages: [JSON.stringify({
              id: data.id,
              message: `Tu mensaje ha sido enviado a ${recipients.length - 1} personas. Gracias!!`,
            })],
          },
        ], errorHandler);

        recipients.map((recipient) => {
          console.log(recipient);
          console.log(data);
          if (recipient.platformId !== data.id) {
            producer.send([
              {
                topic: services[recipient.platform].topics.out,
                messages: [JSON.stringify({
                  id: recipient.platformId,
                  message: data.message,
                })],
              },
            ], errorHandler);
          }
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
