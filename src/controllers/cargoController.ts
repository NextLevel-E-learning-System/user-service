import { Request, Response } from "express";
import { withClient } from "../config/db";

export const listCargos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`SELECT codigo, nome FROM user_service.cargos`);
    res.json(rows);
  });
};

export const createCargo = async (req: Request, res: Response) => {
  const { codigo, nome } = req.body;
  await withClient(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO user_service.cargos(codigo, nome) VALUES ($1,$2) RETURNING *`,
      [codigo, nome]
    );
    res.status(201).json(rows[0]);
  });
};

export const updateCargo = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const { nome } = req.body;
  await withClient(async (c) => {
    const { rows } = await c.query(
      `UPDATE user_service.cargos SET nome=$1, atualizado_em=now() WHERE codigo=$2 RETURNING *`,
      [nome, codigo]
    );
    res.json(rows[0]);
  });
};

export const deleteCargo = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  await withClient(async (c) => {
    await c.query(`DELETE FROM user_service.cargos WHERE codigo=$1`, [codigo]);
    res.status(204).send();
  });
};
