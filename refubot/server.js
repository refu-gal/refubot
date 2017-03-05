// Dependencies
const kafka = require('kafka-node');

// Bot token
const KAFKA_ADDRESS = process.env.KAFKA_ADDRESS || 'kafka:2181';
const KAFKA_LIST_TOPIC = 'topic_list';
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
 let topics = [KAFKA_LIST_TOPIC];
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
 db.run("CREATE TABLE if not exists register (platform TEXT, platformId TEXT, topic TEXT)");

 const getRegisteredOnTopic = (topic,callback) => {
   db.all("SELECT * from register where topic ="topic,function(err,rows){
     for (i =0; i<rows.length; i++) console.log(JSON.stringify(rows[i]));
  });
 }

 const registerInTopic = (platform, platformId, topic) => {
   db.run("INSERT OR REPLACE INTO register(platform, platformId, topic) VALUES (${platform}, ${platformId}, ${topic})" );
 }
 // Hanle messages coming from kafka "topic_list" topic
 const topicsOffset = new kafka.Offset(client);
 const getTopics = (callback) => {
   topicsOffset.fetch([
     {
       topic: KAFKA_LIST_TOPIC,
       offset: 0,
     },
   ], (err, data) => {
     console.log(data);
     if (err) return callback(err, null);
     const topics = data[KAFKA_LIST_TOPIC];
     if (callback) callback(null, topics);
   });
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
   const data = JSON.parse(message.value);

   if (/register (.*)/.test(data.message)) {
     const matches = data.message.match(/register (.*)/);

     // Send message to the kafka in topic
     producer.send([
       {
         topic: KAFKA_LIST_TOPIC,
         messages: [matches[1]],
       },
     ], (err) => {
       if (err) return errorHandler(err);
       getTopics((err, topics) => {
         console.log(topics);
       });
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
