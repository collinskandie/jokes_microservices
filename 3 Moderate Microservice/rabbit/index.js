const amqp = require("amqplib");

async function consumeFromQueue() {
  const connection = await amqp.connect("amqp://localhost"); // RabbitMQ connection URL
  const channel = await connection.createChannel();

  await channel.assertQueue("SUBMITTED_JOKES"); // Queue name

  channel.consume("SUBMITTED_JOKES", (message) => {
    if (message !== null) {
      console.log(message.content.toString());
      channel.ack(message);
    }
  });
}

consumeFromQueue().catch(console.error);
