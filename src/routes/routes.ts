import { Router } from "express";
import * as deptCtrl from "../controllers/departamentoController.js";
import * as cargoCtrl from "../controllers/cargoController.js";
import * as funcCtrl from "../controllers/funcionarioController.js";
import * as dashboardCtrl from "../controllers/dashboardController.js";
import * as instructorCtrl from "../controllers/instructorController.js";
 
export const publicRouter = Router();
publicRouter.get("/departamentos", deptCtrl.listDepartamentos);
publicRouter.get("/cargos", cargoCtrl.listCargos);
publicRouter.post("/register", funcCtrl.registerFuncionario); // auto-cadastro FUNCIONARIO
publicRouter.post("/reset-password", funcCtrl.requestPasswordReset);

export const departamentoRouter = Router();
departamentoRouter.get("/admin", deptCtrl.listAllDepartamentos); // Rota administrativa - todos os departamentos
departamentoRouter.get("/:codigo", deptCtrl.getDepartamento);
departamentoRouter.post("/", deptCtrl.createDepartamento);
departamentoRouter.put("/:codigo", deptCtrl.updateDepartamento);
departamentoRouter.delete("/:codigo", deptCtrl.deleteDepartamento);

export const cargoRouter = Router();
cargoRouter.post("/", cargoCtrl.createCargo);
cargoRouter.put("/:codigo", cargoCtrl.updateCargo);
cargoRouter.delete("/:codigo", cargoCtrl.deleteCargo);

export const funcionarioRouter = Router();
funcionarioRouter.get("/", funcCtrl.listFuncionarios);
funcionarioRouter.get("/dashboard", dashboardCtrl.getDashboard);
funcionarioRouter.get("/:id", funcCtrl.getFuncionario);  // Buscar funcionário por ID
funcionarioRouter.put("/:id/role", funcCtrl.updateFuncionarioRole);

export const instructorRouter = Router();
instructorRouter.get("/", instructorCtrl.listInstructors);
instructorRouter.get("/:id", instructorCtrl.getInstructor);
instructorRouter.post("/", instructorCtrl.createInstructor);
instructorRouter.put("/:id", instructorCtrl.updateInstructor);
instructorRouter.delete("/:id", instructorCtrl.deleteInstructor);
instructorRouter.put("/:id/toggle-status", instructorCtrl.toggleInstructorStatus);
