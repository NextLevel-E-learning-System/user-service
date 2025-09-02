import amqp from 'amqplib';
import { randomUUID } from 'crypto';

let channel: amqp.Channel | null = null;
const EXCHANGE = 'users.events';

async function getChannel() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  return channel;
}

export async function publishDomainEvent(type: string, payload: any) {
  const ch = await getChannel();
  const event = {
    id: randomUUID(),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: payload.correlationId || randomUUID(),
    producer: process.env.SERVICE_NAME || 'user-service',
    payload
  };
  ch.publish(EXCHANGE, type, Buffer.from(JSON.stringify(event)), { contentType: 'application/json' });
}