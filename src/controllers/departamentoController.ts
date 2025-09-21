import { Request, Response } from "express";
import { withClient } from "../config/db.js";

export const listDepartamentos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT 
        d.codigo,
        d.nome,
        d.descricao,
        d.gestor_funcionario_id,
        f.nome as gestor_nome,
        d.ativo,
        d.criado_em,
        d.atualizado_em,
        d.inactivated_at
      FROM user_service.departamentos d
      LEFT JOIN user_service.funcionarios f ON d.gestor_funcionario_id = f.id
      WHERE d.ativo = true
      ORDER BY d.nome
    `);
    res.json(rows);
  });
};

export const listAllDepartamentos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT 
        d.codigo,
        d.nome,
        d.descricao,
        d.gestor_funcionario_id,
        f.nome as gestor_nome,
        f.email as gestor_email,
        d.ativo,
        d.criado_em,
        d.atualizado_em,
        d.inactivated_at,
        COUNT(func.id) as total_funcionarios
      FROM user_service.departamentos d
      LEFT JOIN user_service.funcionarios f ON d.gestor_funcionario_id = f.id
      LEFT JOIN user_service.funcionarios func ON d.codigo = func.departamento_id AND func.ativo = true
      GROUP BY d.codigo, d.nome, d.descricao, d.gestor_funcionario_id, f.nome, f.email, d.ativo, d.criado_em, d.atualizado_em, d.inactivated_at
      ORDER BY d.ativo DESC, d.nome
    `);
    res.json(rows);
  });
};

export const getDepartamento = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT 
        d.codigo,
        d.nome,
        d.descricao,
        d.gestor_funcionario_id,
        f.nome as gestor_nome,
        f.email as gestor_email,
        d.ativo,
        d.criado_em,
        d.atualizado_em,
        d.inactivated_at,
        COUNT(func.id) as total_funcionarios
      FROM user_service.departamentos d
      LEFT JOIN user_service.funcionarios f ON d.gestor_funcionario_id = f.id
      LEFT JOIN user_service.funcionarios func ON d.codigo = func.departamento_id AND func.ativo = true
      WHERE d.codigo = $1
      GROUP BY d.codigo, d.nome, d.descricao, d.gestor_funcionario_id, f.nome, f.email, d.ativo, d.criado_em, d.atualizado_em, d.inactivated_at
    `, [codigo]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }
    
    res.json(rows[0]);
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
