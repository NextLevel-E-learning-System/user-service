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
    const { nome, email, cpf, departamento_id, cargo_nome, role = 'FUNCIONARIO' } = req.body;
    
    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({ erro: 'dados_invalidos', mensagem: 'Nome e email são obrigatórios' });
    }

    // Validar role
    const validRoles = ['ADMIN', 'INSTRUTOR', 'GERENTE', 'FUNCIONARIO'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ erro: 'role_invalida', mensagem: 'Role inválida. Use: ADMIN, INSTRUTOR, GERENTE ou FUNCIONARIO' });
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
    res.json({ items: rows, mensagem: 'Funcionários listados com sucesso' });
  });
};

export const getFuncionario = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id, nome, email, cpf, departamento_id, cargo_nome, xp_total, nivel, role, ativo, criado_em, atualizado_em 
       FROM user_service.funcionarios 
       WHERE id = $1 AND ativo = true`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ erro: 'funcionario_nao_encontrado', mensagem: 'Funcionário não encontrado' });
    }
    
    res.json({ funcionario: rows[0], mensagem: 'Funcionário obtido com sucesso' });
  });
};

export const updateFuncionarioRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const actor_id = (req as Request & { userId: string }).userId;

  await withClient(async (c) => {
    // Iniciar transação
    await c.query('BEGIN');

    try {
      // Buscar role atual antes de atualizar
      const { rows: currentRows } = await c.query(`
        SELECT role FROM user_service.funcionarios 
        WHERE id = $1 AND ativo = true
      `, [id]);

      if (currentRows.length === 0) {
        await c.query('ROLLBACK');
        return res.status(404).json({ 
          erro: 'funcionario_nao_encontrado', 
          mensagem: 'Funcionário não encontrado' 
        });
      }

      const oldRole = currentRows[0].role;

      // Atualizar role na tabela funcionarios
      const { rows } = await c.query(`
        UPDATE user_service.funcionarios 
        SET role = $1, atualizado_em = NOW() 
        WHERE id = $2 AND ativo = true 
        RETURNING *
      `, [role, id]);

      // Gerenciar tabela instrutores baseado na mudança de role
      if (role === 'INSTRUTOR' && oldRole !== 'INSTRUTOR') {
        // Adicionar à tabela instrutores se a nova role é INSTRUTOR
        await c.query(`
          INSERT INTO user_service.instrutores (funcionario_id)
          VALUES ($1)
          ON CONFLICT (funcionario_id) DO NOTHING
        `, [id]);
      } else if (role !== 'INSTRUTOR' && oldRole === 'INSTRUTOR') {
        // Remover da tabela instrutores se a role deixou de ser INSTRUTOR
        await c.query(`
          DELETE FROM user_service.instrutores 
          WHERE funcionario_id = $1
        `, [id]);
      }

      // Commit da transação
      await c.query('COMMIT');

      await emitUserRoleChanged(id, role);

      res.json({ 
        funcionario: rows[0], 
        granted_by: actor_id,
        mensagem: `Role atualizada para ${role}${
          role === 'INSTRUTOR' && oldRole !== 'INSTRUTOR' 
            ? ' e adicionado à tabela de instrutores' 
            : role !== 'INSTRUTOR' && oldRole === 'INSTRUTOR'
            ? ' e removido da tabela de instrutores'
            : ''
        }`
      });
    } catch (txError) {
      await c.query('ROLLBACK');
      throw txError;
    }
  });
};

export const updateFuncionario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, email, departamento_id, cargo_nome, role, ativo } = req.body;
  const actor_id = (req as Request & { userId: string }).userId;

  try {
    await withClient(async (c) => {
      // Iniciar transação
      await c.query('BEGIN');

      try {
        // Buscar funcionário atual
        const { rows: currentRows } = await c.query(`
          SELECT * FROM user_service.funcionarios 
          WHERE id = $1
        `, [id]);

        if (currentRows.length === 0) {
          await c.query('ROLLBACK');
          return res.status(404).json({ 
            erro: 'funcionario_nao_encontrado', 
            mensagem: 'Funcionário não encontrado' 
          });
        }

        const currentFunc = currentRows[0];
        const oldRole = currentFunc.role;
        const oldAtivo = currentFunc.ativo;

        // Construir query de atualização dinamicamente
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (nome !== undefined) {
          updates.push(`nome = $${paramIndex++}`);
          values.push(nome);
        }
        if (email !== undefined) {
          updates.push(`email = $${paramIndex++}`);
          values.push(email);
        }
        if (departamento_id !== undefined) {
          updates.push(`departamento_id = $${paramIndex++}`);
          values.push(departamento_id);
        }
        if (cargo_nome !== undefined) {
          updates.push(`cargo_nome = $${paramIndex++}`);
          values.push(cargo_nome);
        }
        if (role !== undefined) {
          updates.push(`role = $${paramIndex++}`);
          values.push(role);
        }
        if (ativo !== undefined) {
          updates.push(`ativo = $${paramIndex++}`);
          values.push(ativo);
          
          // Se está desativando, adicionar timestamp
          if (!ativo && oldAtivo) {
            updates.push(`inactivated_at = NOW()`);
          } else if (ativo && !oldAtivo) {
            updates.push(`inactivated_at = NULL`);
          }
        }

        // Adicionar atualizado_em
        updates.push(`atualizado_em = NOW()`);
        values.push(id);

        // Executar UPDATE
        const { rows } = await c.query(`
          UPDATE user_service.funcionarios 
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `, values);

        const updatedFunc = rows[0];

        // Gerenciar tabela instrutores se role mudou
        if (role !== undefined && role !== oldRole) {
          if (role === 'INSTRUTOR' && oldRole !== 'INSTRUTOR') {
            // Adicionar à tabela instrutores
            await c.query(`
              INSERT INTO user_service.instrutores (funcionario_id)
              VALUES ($1)
              ON CONFLICT (funcionario_id) DO NOTHING
            `, [id]);
          } else if (role !== 'INSTRUTOR' && oldRole === 'INSTRUTOR') {
            // Remover da tabela instrutores
            await c.query(`
              DELETE FROM user_service.instrutores 
              WHERE funcionario_id = $1
            `, [id]);
          }

          // Emitir evento de mudança de role
          await emitUserRoleChanged(id, role);
        }

        // Commit da transação
        await c.query('COMMIT');

        res.json({ 
          funcionario: updatedFunc,
          updated_by: actor_id,
          mensagem: 'Funcionário atualizado com sucesso'
        });
      } catch (txError) {
        await c.query('ROLLBACK');
        throw txError;
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: error.message || 'Erro ao atualizar funcionário' 
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
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
