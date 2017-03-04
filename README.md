# Galibot

## The team

- @antonmry: developing the backend system and the comunication between the different platforms.

## Requirements

You will need to have:

 - [docker](https://www.docker.io/gettingstarted/#h_installation)
 - [docker compose](http://docs.docker.com/compose/install/).
 - [jq](https://stedolan.github.io/jq/)

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
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic facebook_in
docker exec kafka /opt/kafka_2.11-0.10.1.0/bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic facebook_out
```

Add kafka to /etc/hosts:

```
127.0.0.1   kafka
```

## Modules

## Kafka

All the messaging clients will subscribe/publish to kafka, so we can abstract all the logic from the different platforms and languages.

We initially will have two topics:

- Telegram
- Facebook

Node library for Kafka: https://www.npmjs.com/package/kafka-node

More info: https://github.com/spotify/docker-kafka/pull/64/files

### How to test Kafka


### Facebook Messenger

TBC

### Telegram

Telegram bot implementation

### SMS

TBC

### Others

TBC
