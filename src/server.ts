import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { z } from 'zod';
import { publishDomainEvent } from './utils/events.js';
import { withClient } from './db.js';
 
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: '*'}));
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }));

  app.get('/users/v1/me', async (req, res) => {
    const userId = req.header('x-user-id');
    if (!userId) return res.status(401).json({ error: 'missing_user_context' });
    try {
      const row = await withClient(async c => {
        const r = await c.query('select id, nome as name, email, cargo, xp_total, nivel, status from funcionarios where id=$1', [userId]);
        return r.rows[0];
      });
      if (!row) return res.status(404).json({ error: 'user_not_found' });
      res.json(row);
    } catch (err:any) {
      logger.error({ err }, 'fetch_me_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.post('/users/v1', async (req, res) => {
    const schema = z.object({ id: z.string().uuid(), cpf: z.string().min(11).max(14), nome: z.string(), email: z.string().email(), departamento: z.string().optional(), cargo: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
    try {
      await withClient(c => c.query('insert into funcionarios (id, cpf, nome, email, departamento_id, cargo, xp_total, nivel, status) values ($1,$2,$3,$4,$5,$6,0,$7,$8)', [parsed.data.id, parsed.data.cpf, parsed.data.nome, parsed.data.email, parsed.data.departamento || null, parsed.data.cargo || null, 'Iniciante', 'ATIVO']));
      publishDomainEvent('users.v1.UserRegistered', {
        userId: parsed.data.id,
        email: parsed.data.email,
        name: parsed.data.nome
      }).catch(err => logger.error({ err }, 'failed_to_publish_UserRegistered'));
      res.status(201).json({ id: parsed.data.id });
    } catch (err:any) {
      if (err.code === '23505') return res.status(409).json({ error: 'duplicate' });
      logger.error({ err }, 'create_user_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.get('/users/v1/:id', async (req, res) => {
    try {
      const row = await withClient(async c => {
        const r = await c.query('select id, nome as name, email, cargo, xp_total, nivel, status from funcionarios where id=$1', [req.params.id]);
        return r.rows[0];
      });
      if (!row) return res.status(404).json({ error: 'not_found' });
      res.json(row);
    } catch (err:any) {
      logger.error({ err }, 'get_user_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.patch('/users/v1/:id/xp', async (req, res) => {
    const schema = z.object({ delta: z.number().int() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation_error' });
    try {
      const updated = await withClient(async c => {
        const r = await c.query('update funcionarios set xp_total = xp_total + $1 where id=$2 returning id, xp_total', [parsed.data.delta, req.params.id]);
        return r.rows[0];
      });
      if (!updated) return res.status(404).json({ error: 'not_found' });
      res.json(updated);
    } catch (err:any) {
      logger.error({ err }, 'update_xp_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return app;
}