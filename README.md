# Galibot

## Usage

- Subscribe to a city `estoy en vigo`
- Unsubscribe from a city `no estoy en vigo`
- List subscribed cities `donde estoy`
- Create an alarm `algo está pasando en|por|a|de vigo`

## The team

- @Testasliando: all the design, logo, [website](http://refubot.refu.gal) and marketing campaing.
- @rfsouto: the telegram integration and part of the bot logic implementation.
- @kdarrey: the facebook integration and part of the bot logic implementation.
- @danybmx: develop the telegram bot logic, the Apache Kafka integration and the website.
- @antonmry: creator of the initial idea and all the devops tasks (setup AWS, Kafka and Docker) and the SMS integration.

## Requirements

You will need to have:

 - [docker](https://www.docker.io/gettingstarted/#h_installation)
 - [docker compose](http://docs.docker.com/compose/install/)

## How to start?

Start kafka:

```
docker pull spotify/kafka
docker run -d -p 2181:2181 -p 9092:9092 --env ADVERTISED_HOST=kafka --env ADVERTISED_PORT=9092 --name kafka spotify/kafka
```

Create topics:

```
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic telegram_in
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic telegram_out
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic telegram_ids
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic facebook_in
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic facebook_out
```

List topics:

```
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --list --zookeeper localhost:2181
```

Add kafka to /etc/hosts:

```
127.0.0.1   kafka
```

## Modules

### Kafka

All the messaging clients will subscribe/publish to kafka, so we can abstract all the logic from the different platforms and languages.

We initially will have two topics:

- Telegram
- Facebook

Node library for Kafka: https://www.npmjs.com/package/kafka-node

More info: https://github.com/spotify/docker-kafka/pull/64/files

#### How to test Kafka

**Start a producer (in a new terminal window)**

```
docker run -it --rm --link kafka spotify/kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-console-producer.sh --broker-list kafka:9092 --topic test
```

**Start a consumer (in a new terminal window)**

```
docker run -it --rm --link kafka spotify/kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic test --from-beginning
```

### Facebook Messenger

Facebook bot implementation

[Documentation](https://developers.facebook.com/docs/messenger-platform)

### Telegram

Telegram bot implementation

[Documentation](https://core.telegram.org/bots/api)

### SMS - Nexmo

Our number is +34 986080052.

To send/receive an SMS:

[Documentation](https://docs.nexmo.com/messaging/sms-api)

### AWS

```
aws acm request-certificate --domain-name bot.galiglobal.org
```
