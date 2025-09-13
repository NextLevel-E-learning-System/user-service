import { Request, Response } from "express";
import { withClient } from "../config/db.js";

export const listDepartamentos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`SELECT codigo, nome FROM user_service.departamentos WHERE ativo=true`);
    res.json(rows);
  });
};

export const createDepartamento = async (req: Request, res: Response) => {
  const { codigo, nome, descricao, gestor_funcionario_id } = req.body;
  await withClient(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO user_service.departamentos(codigo, nome, descricao, gestor_funcionario_id)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [codigo, nome, descricao, gestor_funcionario_id]
    );
    res.status(201).json(rows[0]);
  });
};

export const updateDepartamento = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const { nome, descricao, gestor_funcionario_id } = req.body;
  await withClient(async (c) => {
    const { rows } = await c.query(
      `UPDATE user_service.departamentos
       SET nome=$1, descricao=$2, gestor_funcionario_id=$3, atualizado_em=now()
       WHERE codigo=$4 RETURNING *`,
      [nome, descricao, gestor_funcionario_id, codigo]
    );
    res.json(rows[0]);
  });
};

export const deactivateDepartamento = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  await withClient(async (c) => {
    await c.query(`UPDATE user_service.departamentos SET ativo=false, inactivated_at=now() WHERE codigo=$1`, [codigo]);
    res.status(204).send();
  });
};
