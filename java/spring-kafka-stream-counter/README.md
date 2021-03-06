# Introduction

Sample project for Kafka.

To send messages to the kafka topics just navigate to http://localhost:8080 and click on the links. Each click will
generate an event called pageView into a Kafka topic for further processing.

# Prerequisites

## Install Kafka on Mac

I'm using Brew so it was installed and started as below:

```
$ brew install kafka
$ zkServer start 
$ kafka-server-start /usr/local/etc/kafka/server.properties
```

## Use KafkaCat

KafkaCat can be used to listen to a topic from command line.
```brew install kafkacat```

Run a listener on a topic
```kafkacat -b localhost:9092 -t pageViewTracker-0```

## Implementations findings

* @KafkaListener needs to have property spring.kafka.listener.concurrency set to a value higher than number of
  partitions if we want to use concurrency inside the application and listen to ALL partitions. A real world scenario
  would rather look like a deployed microservice listens to a dedicated partition and we use Docker to spawn another
  container for listening to another and so on.
* Lombok JSON deserialization on immutable objects and Lombok. We need to annotate it as follows: @AllArgsConstructor(
  onConstructor = @__(@JsonCreator)), see OrderDto and a lombok.config file
  with ```lombok.anyConstructor.addConstructorProperties = true```to enable it.
* Mapstruct interface need to have spring ```componentModel = "spring"``` if we want to use it as a mapper.
* Kafka streams creates in and out topics automatically inside Kafka (If they don't exist already) if the following
  dependency is on the classpath:

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-kafka</artifactId>
  <version>3.1.1</version>
</dependency>
```

This dependency is needed if we want to use Kafka Streams. One easy way to create a Kafka stream is by creating a @Bean
with:

```Function<KStream<Input,Output>, KStream<Input,Output>> process() {}```
This will create a stream listener automatically listening to the method name topic, in this case process-in-0 and
produce result to process-out-0. If we want to override the behaviour do a configuration in application.yml like so (See
the bindings section where we map it to REAL topics inside Kafka):

```
spring:
  cloud:
    stream:
      function:
        bindings:
          # Point to other kafka streams
          process-in-0: pageViewTrackerTest
          process-out-0: categoryCounterTest
```

The configuration above will tell the stream binding to use pageViewTracker instead of process-in-0 topic. In this way
you can customize which topic to listen to.
