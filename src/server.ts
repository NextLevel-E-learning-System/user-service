import express from 'express';
import cors from 'cors';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import { errorHandler } from './middleware/errorHandler.js';
import { cargoRouter, departamentoRouter, funcionarioRouter, publicRouter } from './routes/routes.js';

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  const openapiSpec = loadOpenApi('User Service API');
  app.get('/openapi.json', (_req,res)=> res.json(openapiSpec));

  app.use('/users/v1', publicRouter);
  app.use('/users/v1/funcionarios', funcionarioRouter);
  app.use('/users/v1/departamentos', departamentoRouter);
  app.use('/users/v1/cargos', cargoRouter);
  
  app.use(errorHandler);
  return app;
}