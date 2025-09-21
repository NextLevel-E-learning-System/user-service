import { Router } from "express";
import * as deptCtrl from "../controllers/departamentoController.js";
import * as cargoCtrl from "../controllers/cargoController.js";
import * as funcCtrl from "../controllers/funcionarioController.js";
import * as dashboardCtrl from "../controllers/dashboardController.js";
 
export const publicRouter = Router();
publicRouter.get("/departamentos", deptCtrl.listDepartamentos);
publicRouter.get("/cargos", cargoCtrl.listCargos);
publicRouter.post("/register", funcCtrl.registerFuncionario); // auto-cadastro ALUNO
publicRouter.post("/reset-password", funcCtrl.requestPasswordReset);

export const departamentoRouter = Router();
departamentoRouter.get("/", deptCtrl.listAllDepartamentos);
departamentoRouter.get("/:codigo", deptCtrl.getDepartamento);
departamentoRouter.post("/", deptCtrl.createDepartamento);
departamentoRouter.put("/:codigo", deptCtrl.updateDepartamento);
departamentoRouter.delete("/:codigo", deptCtrl.deactivateDepartamento);

export const cargoRouter = Router();
cargoRouter.post("/", cargoCtrl.createCargo);
cargoRouter.put("/:codigo", cargoCtrl.updateCargo);
cargoRouter.delete("/:codigo", cargoCtrl.deleteCargo);

export const funcionarioRouter = Router();
funcionarioRouter.get("/", funcCtrl.listFuncionarios);
funcionarioRouter.get("/dashboard", dashboardCtrl.getDashboard);
funcionarioRouter.put("/:id/role", funcCtrl.updateFuncionarioRole);
