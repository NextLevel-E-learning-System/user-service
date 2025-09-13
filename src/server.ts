import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { logger } from './config/logger.js';
import { loadOpenApi } from './config/openapi.js';
import { cargoRouter, departamentoRouter, funcionarioRouter, publicRouter } from './routes/routes.js';

const app = express();
app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  const openapiSpec = loadOpenApi('User Service API');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });

app.use("/public", publicRouter);
app.use("/departamentos", departamentoRouter);
app.use("/cargos", cargoRouter);
app.use("/funcionarios", funcionarioRouter);

export default app;
