import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export async function getChannel() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await conn.createChannel();
  return channel;
}

export async function publishExchange(exchange: string, payload: any) {
  const ch = await getChannel();
  await ch.assertExchange(exchange, 'fanout', { durable: true });
  ch.publish(exchange, '', Buffer.from(JSON.stringify(payload)), { persistent: true });
}
