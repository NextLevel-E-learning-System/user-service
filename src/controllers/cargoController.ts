import { Request, Response } from "express";
import { withClient } from "../config/db";

export const listCargos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`SELECT codigo, nome FROM user_service.cargos`);
    res.json(rows);
  });
};
