import { Router } from "express";
import { registerFuncionario, listFuncionarios } from "../controllers/funcionarioController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

export const funcionarioRouter = Router();
funcionarioRouter.post("/register", registerFuncionario); // auto-cadastro ALUNO
funcionarioRouter.get("/", authenticate, authorizeAdmin, listFuncionarios); // lista apenas admin
