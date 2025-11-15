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
departamentoRouter.post("/", deptCtrl.createDepartamento);
departamentoRouter.put("/:codigo", deptCtrl.updateDepartamento);
departamentoRouter.delete("/:codigo", deptCtrl.deleteDepartamento);

export const funcionarioRouter = Router();
funcionarioRouter.get("/", funcCtrl.listFuncionarios);
funcionarioRouter.get("/dashboard", dashboardCtrl.getDashboard);
funcionarioRouter.put("/:id", funcCtrl.updateFuncionario);  // Atualizar funcionário completo

export const instructorRouter = Router();
instructorRouter.get("/", instructorCtrl.listInstructors);
instructorRouter.post("/", instructorCtrl.createInstructor);
instructorRouter.put("/:id", instructorCtrl.updateInstructor);
instructorRouter.delete("/:id", instructorCtrl.deleteInstructor);
