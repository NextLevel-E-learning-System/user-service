import { Request, Response } from "express";
import { createAuthUser } from "../services/authService.js";
import { withClient } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import bcrypt from 'bcryptjs';

export async function hashPassword(pwd: string) {
  return bcrypt.hash(pwd, 12);
}

export const registerFuncionario = async (req: Request, res: Response) => {
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'gmail.com').split(',');
  const isValidDomain = allowedDomains.some(domain => email.endsWith(`@${domain.trim()}`));
  if (!isValidDomain) {
    throw new HttpError(400, 'dominio_nao_permitido', `Apenas emails dos domínios ${allowedDomains.join(', ')} são permitidos para auto-cadastro`);
  }
  const { nome, email, cpf, departamento_id, cargo_nome } = req.body;
  const senha = Math.random().toString().slice(-6); // senha 6 dígitos
  const senhaHash = await hashPassword(senha);

  try {
    const authUser = await createAuthUser(email, senhaHash);

    await withClient(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO user_service.funcionarios
         (auth_user_id, nome, email, cpf, departamento_id, cargo_nome)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [authUser.id, nome, email, cpf, departamento_id, cargo_nome]
      );
      const funcionario = rows[0];

      // Role padrão ALUNO
      const roleRes = await c.query(`SELECT id FROM user_service.roles WHERE nome='ALUNO'`);
      await c.query(
        `INSERT INTO user_service.user_roles(user_id, role_id, granted_by)
         VALUES ($1,$2,$3)`,
        [funcionario.id, roleRes.rows[0].id, null]
      );

      // Outbox event
      await c.query(
        `INSERT INTO user_service.outbox_events(topic, payload)
         VALUES ('user.created', $1)`,
        [JSON.stringify(funcionario)]
      );

      res.status(201).json(funcionario);
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const listFuncionarios = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`SELECT * FROM user_service.funcionarios WHERE ativo=true`);
    res.json(rows);
  });
};
