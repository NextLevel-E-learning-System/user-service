import { Router } from "express";
import { listDepartamentos } from "../controllers/departamentoController.js";
import { listCargos } from "../controllers/cargoController.js";

export const publicRouter = Router();
publicRouter.get("/departamentos", listDepartamentos);
publicRouter.get("/cargos", listCargos);
