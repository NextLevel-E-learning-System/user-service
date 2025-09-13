import { withClient } from '../config/db.js';
import { publishExchange } from '../utils/rabbit.js';

const INTERVAL = parseInt(process.env.OUTBOX_PUBLISH_INTERVAL_MS || '2000', 10);

export async function startOutboxPublisher() {
  setInterval(async () => {
    try {
      await withClient(async (c) => {
        const res = await c.query('select id, topic, payload from user_service.outbox_events where processed = false order by id limit 50 for update skip locked');
        for (const row of res.rows) {
          try {
            await publishExchange(row.topic, row.payload);
            await c.query('update user_service.outbox_events set processed=true where id=$1', [row.id]);
          } catch (e) {
            console.error('[outboxPublisher] publish failed', e);
            // keep it unprocessed for next attempt
          }
        }
      });
    } catch (e) {
      console.error('[outboxPublisher] loop error', e);
    }
  }, INTERVAL);
}
