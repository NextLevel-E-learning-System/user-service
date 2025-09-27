import express from 'express';
import cors from 'cors';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import { cargoRouter, departamentoRouter, funcionarioRouter, publicRouter } from './routes/routes.js';

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.use((req, _res, next) => { 
    (req as express.Request & { log: typeof logger }).log = logger; 
    next(); 
  });

  app.get('/openapi.json', async (_req,res)=> {
    try {
      const openapiSpec = await loadOpenApi('User Service API');
      res.json(openapiSpec);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load OpenAPI spec' });
    }
  });

  app.use('/users/v1', publicRouter);
  app.use('/users/v1/funcionarios', funcionarioRouter);
  app.use('/users/v1/departamentos', departamentoRouter);
  app.use('/users/v1/cargos', cargoRouter);
  
  return app;
}