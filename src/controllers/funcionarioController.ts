import { Request, Response } from "express";
import { createAuthUser, resetPassword } from "../services/authService.js";
import { withClient } from "../config/db.js";
import bcrypt from 'bcryptjs';
import { emitUserCreated, emitUserPasswordReset, emitUserRoleChanged } from "../services/events.js";

export async function hashPassword(pwd: string) {
  return bcrypt.hash(pwd, 12);
}

export const registerFuncionario = async (req: Request, res: Response) => {
  try {
    const { nome, email, cpf, departamento_id, cargo_nome } = req.body;
    
    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

  // Agora o auth-service gera a senha e devolve
  const authUser = await createAuthUser(email);

    await withClient(async (c) => {
      const { rows } = await c.query(`
        INSERT INTO user_service.funcionarios
        (auth_user_id, nome, email, cpf, departamento_id, cargo_nome)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
      `, [authUser.id, nome, email, cpf, departamento_id, cargo_nome]);
      const funcionario = rows[0];

      const roleRes = await c.query(`SELECT id FROM user_service.roles WHERE nome='ALUNO'`);
      await c.query(
        `INSERT INTO user_service.user_roles(user_id, role_id, granted_by)
         VALUES ($1,$2,$3)`,
        [funcionario.id, roleRes.rows[0].id, null]
      );

  // Não temos mais a senha aqui; notification-service enviará email usando evento do auth-service
  await emitUserCreated(funcionario.email, undefined as unknown as string, funcionario.id, funcionario.nome);

      res.status(201).json(funcionario);
    });
  } catch (error) {
    console.error('Erro ao registrar funcionário:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ error: 'Erro interno do servidor', details: errorMessage });
  }
};

export const listFuncionarios = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`SELECT * FROM user_service.funcionarios WHERE ativo=true`);
    res.json(rows);
  });
};

export const updateFuncionarioRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role_nome } = req.body;
  const actor_id = (req as Request & { userId: string }).userId;

  await withClient(async (c) => {
    const role = (await c.query(`SELECT id FROM user_service.roles WHERE nome=$1`, [role_nome])).rows[0];
    if (!role) return res.status(404).json({ error: 'Role não encontrada' });

    const { rows } = await c.query(`
      INSERT INTO user_service.user_roles(user_id, role_id, granted_by)
      VALUES ($1,$2,$3) ON CONFLICT (user_id, role_id) DO UPDATE SET active=true, granted_by=$3 RETURNING *
    `, [id, role.id, actor_id]);

        await c.query(
      `INSERT INTO user_service.user_role_history(user_role_id, user_id, role_id, action, actor_id)
       VALUES ($1,$2,$3,'GRANTED',$4)`,
      [rows[0].id, id, role.id, actor_id]
    );

    await emitUserRoleChanged(id, role_nome);

    res.json(rows[0]);
  });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email_obrigatorio" });

  

  const novaSenha = Math.random().toString().slice(-6);
  await resetPassword(email, novaSenha);

    await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id FROM user_service.funcionarios WHERE email=$1 AND ativo=true`,
      [email]
    );
    if (rows.length === 0) return res.status(404).json({ error: "usuario_nao_encontrado" });
    const funcionario = rows[0];

    await emitUserPasswordReset(email, funcionario.id, novaSenha);

  res.json({ message: 'Senha redefinida e evento enviado.' });
});
};