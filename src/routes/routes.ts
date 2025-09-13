import { Router } from "express";
import * as deptCtrl from "../controllers/departamentoController.js";
import * as cargoCtrl from "../controllers/cargoController.js";
import * as funcCtrl from "../controllers/funcionarioController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

export const publicRouter = Router();
publicRouter.get("/departamentos", deptCtrl.listDepartamentos);
publicRouter.get("/cargos", cargoCtrl.listCargos);

export const departamentoRouter = Router();
departamentoRouter.use(authenticate, authorizeAdmin);
departamentoRouter.post("/", deptCtrl.createDepartamento);
departamentoRouter.put("/:codigo", deptCtrl.updateDepartamento);
departamentoRouter.delete("/:codigo", deptCtrl.deactivateDepartamento);

export const cargoRouter = Router();
cargoRouter.use(authenticate, authorizeAdmin);
cargoRouter.post("/", cargoCtrl.createCargo);
cargoRouter.put("/:codigo", cargoCtrl.updateCargo);
cargoRouter.delete("/:codigo", cargoCtrl.deleteCargo);

export const funcionarioRouter = Router();
funcionarioRouter.post("/register", funcCtrl.registerFuncionario); // auto-cadastro ALUNO
funcionarioRouter.get("/", authenticate, authorizeAdmin, funcCtrl.listFuncionarios);
funcionarioRouter.put("/:id/role", authenticate, authorizeAdmin, funcCtrl.updateFuncionarioRole);
funcionarioRouter.post("/reset-password", funcCtrl.requestPasswordReset);