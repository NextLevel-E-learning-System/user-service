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
    const { nome, email, cpf, departamento_id, cargo_nome, role = 'ALUNO' } = req.body;
    
    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({ erro: 'dados_invalidos', mensagem: 'Nome e email são obrigatórios' });
    }

    // Validar role
    const validRoles = ['ADMIN', 'INSTRUTOR', 'GERENTE', 'ALUNO'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ erro: 'role_invalida', mensagem: 'Role inválida. Use: ADMIN, INSTRUTOR, GERENTE ou ALUNO' });
    }

    // IMPORTANTE: Validar CPF ANTES de criar usuário no auth-service
    if (cpf) {
      await withClient(async (c) => {
        const { rows: existingCpf } = await c.query(
          `SELECT id FROM user_service.funcionarios WHERE cpf = $1 AND ativo = true`,
          [cpf]
        );
        if (existingCpf.length > 0) {
          throw new Error('cpf_ja_cadastrado');
        }
      });
    }

    // Criar usuário no auth-service (que enviará emails)
    await createAuthUser(email);

    await withClient(async (c) => {
      const { rows } = await c.query(`
        INSERT INTO user_service.funcionarios
        (nome, email, cpf, departamento_id, cargo_nome, role)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
      `, [nome, email, cpf, departamento_id, cargo_nome, role]);
      const funcionario = rows[0];

      // Emitir evento adicional do user-service (se necessário)
      await emitUserCreated(funcionario.email, undefined as unknown as string, funcionario.id, funcionario.nome);

  res.status(201).json({ funcionario, mensagem: 'Funcionário criado com sucesso' });
    });
  } catch (error) {
    console.error('Erro ao registrar funcionário:', error);
    
    // Tratar erros específicos
    if (error instanceof Error) {
      if (error.message === 'cpf_ja_cadastrado') {
  return res.status(409).json({ erro: 'cpf_ja_cadastrado', mensagem: 'CPF já está cadastrado no sistema' });
      }
      if (error.message === 'email_ja_cadastrado') {
  return res.status(409).json({ erro: 'email_ja_cadastrado', mensagem: 'Email já está cadastrado no sistema' });
      }
      if (error.message === 'dominio_nao_permitido') {
  return res.status(400).json({ erro: 'dominio_nao_permitido', mensagem: 'Domínio de email não permitido' });
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
  res.status(500).json({ erro: 'erro_interno', mensagem: 'Erro interno do servidor', detalhes: errorMessage });
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
  const { role } = req.body;
  const actor_id = (req as Request & { userId: string }).userId;

  // Validar role
  const validRoles = ['ADMIN', 'INSTRUTOR', 'GERENTE', 'ALUNO'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ erro: 'role_invalida', mensagem: 'Role inválida. Use: ADMIN, INSTRUTOR, GERENTE ou ALUNO' });
  }

  await withClient(async (c) => {
    // Atualizar role diretamente na tabela funcionarios
    const { rows } = await c.query(`
      UPDATE user_service.funcionarios 
      SET role = $1, atualizado_em = NOW() 
      WHERE id = $2 AND ativo = true 
      RETURNING *
    `, [role, id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: 'funcionario_nao_encontrado', mensagem: 'Funcionário não encontrado' });
    }

    await emitUserRoleChanged(id, role);

    res.json({ 
      funcionario: rows[0], 
      granted_by: actor_id,
      mensagem: `Role atualizada para ${role}`
    });
  });
};export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: 'email_obrigatorio', mensagem: 'Email é obrigatório' });

  const novaSenha = Math.random().toString().slice(-6);
  await resetPassword(email, novaSenha);

  await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id FROM user_service.funcionarios WHERE email=$1 AND ativo=true`,
      [email]
    );
  if (rows.length === 0) return res.status(404).json({ erro: 'usuario_nao_encontrado', mensagem: 'Usuário não encontrado' });
    const funcionario = rows[0];

    await emitUserPasswordReset(email, funcionario.id, novaSenha);

  res.json({ mensagem: 'Senha redefinida e evento enviado.' });
  });
};
