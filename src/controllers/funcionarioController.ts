import { Request, Response } from "express";
import { withClient } from "../config/db.js";
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { emitUserCreated, emitUserPasswordReset, emitUserRoleChanged } from "../services/events.js";

export async function hashPassword(pwd: string) {
   return createHash('sha256').update(pwd).digest('hex');
}
export const registerFuncionario = async (req: Request, res: Response) => {
  try {
    const { nome, email, cpf, departamento_id, cargo_nome, role = 'FUNCIONARIO', ativo = true } = req.body;
    
    // Validação básica
    if (!nome || !email || !cpf) {
      return res.status(400).json({ erro: 'dados_invalidos', mensagem: 'Nome, email e CPF são obrigatórios' });
    }

    // Validar CPF: apenas números e exatamente 11 dígitos
    const cpfLimpo = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ 
        erro: 'cpf_invalido', 
        mensagem: 'CPF deve conter exatamente 11 dígitos numéricos' 
      });
    }

    // Validar domínio de email
    const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || 'gmail.com').split(',');
    const isValidDomain = allowedDomains.some(domain => 
      email.toLowerCase().endsWith(`@${domain.trim().toLowerCase()}`)
    );
    if (!isValidDomain) {
      return res.status(400).json({ 
        erro: 'dominio_nao_permitido', 
        mensagem: `Apenas emails dos domínios ${allowedDomains.join(', ')} são permitidos para auto-cadastro` 
      });
    }

    // Validar role
    const validRoles = ['ADMIN', 'INSTRUTOR', 'GERENTE', 'FUNCIONARIO'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ erro: 'role_invalida', mensagem: 'Role inválida. Use: ADMIN, INSTRUTOR, GERENTE ou FUNCIONARIO' });
    }

    // Gerar senha aleatória
   const senhaClara = Math.random().toString().slice(-6);
  const senhaHash = await bcrypt.hash(senhaClara, 12);

    await withClient(async (c) => {
      // Usar transação para garantir atomicidade
      await c.query('BEGIN');

      try {
        // 1. Verificar se CPF já existe
        const { rows: existingCpf } = await c.query(
          `SELECT id FROM user_service.funcionarios WHERE cpf = $1`,
          [cpfLimpo]
        );
        if (existingCpf.length > 0) {
          throw new Error('cpf_ja_cadastrado');
        }

        // 2. Verificar se email já existe no auth_service
        const { rows: existingEmail } = await c.query(
          `SELECT funcionario_id FROM auth_service.usuarios WHERE email = $1`,
          [email]
        );
        if (existingEmail.length > 0) {
          throw new Error('email_ja_cadastrado');
        }

        // 3. Criar usuário no user_service.funcionarios
        const { rows: funcionarioRows } = await c.query(`
          INSERT INTO user_service.funcionarios
          (nome, email, cpf, departamento_id, cargo_nome, role, ativo, xp_total, nivel)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
        `, [nome, email, cpfLimpo, departamento_id, cargo_nome, role, true, 0, 'Iniciante']);
        const funcionario = funcionarioRows[0];

        // 4. Criar usuário no auth_service.usuarios com o funcionario_id
        await c.query(`
          INSERT INTO auth_service.usuarios (funcionario_id, email, senha_hash)
          VALUES ($1, $2, $3)
        `, [funcionario.id, funcionario.email, senhaHash]);

        // Commit da transação
        await c.query('COMMIT');

        // Emitir evento com a senha (será capturado pelo notification-service)
        await emitUserCreated(funcionario.email, senhaClara, funcionario.id, funcionario.nome);

        res.status(201).json({ funcionario, mensagem: 'Funcionário criado com sucesso' });
      } catch (error) {
        // Rollback em caso de erro
        await c.query('ROLLBACK');
        throw error;
      }
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
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ erro: 'erro_interno', mensagem: 'Erro interno do servidor', detalhes: errorMessage });
  }
};

export const listFuncionarios = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT * FROM user_service.funcionarios 
      ORDER BY criado_em DESC
    `);
    res.json({ items: rows, mensagem: 'Funcionários listados com sucesso' });
  });
};

export const getFuncionario = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id, nome, email, cpf, departamento_id, cargo_nome, xp_total, nivel, role, ativo, criado_em, atualizado_em 
       FROM user_service.funcionarios 
       WHERE id = $1`,
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
        WHERE id = $1
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
        WHERE id = $2
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

        // Atualizar status no auth-service se mudou (direto no banco)
        if (ativo !== undefined && ativo !== oldAtivo) {
          try {
            // Atualizar status e inactivated_at na tabela auth_service.usuarios
            await c.query(`
              UPDATE auth_service.usuarios 
              SET ativo = $1, 
                  inactivated_at = CASE WHEN $1 = false THEN NOW() ELSE NULL END
              WHERE email = $2
            `, [ativo, updatedFunc.email]);
            
            // Se desativou, invalidar todos os tokens ativos
            if (!ativo) {
              await c.query(`
                UPDATE auth_service.tokens 
                SET ativo = false 
                WHERE funcionario_id = $1 AND ativo = true
              `, [id]);
            }
          } catch (authError) {
            console.error('Erro ao atualizar status no auth-service:', authError);
            // Não faz rollback - funcionário foi atualizado, mas pode haver problema no auth
          }
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

  const senhaHash = await bcrypt.hash(novaSenha, 12);

  await withClient(async (c) => {
    const { rows } = await c.query(
      `SELECT id FROM user_service.funcionarios WHERE email=$1 AND ativo=true`,
      [email]
    );
  if (rows.length === 0) return res.status(404).json({ erro: 'usuario_nao_encontrado', mensagem: 'Usuário não encontrado' });
    const funcionario = rows[0];

    await emitUserPasswordReset(email, funcionario.id, senhaHash);

  res.json({ mensagem: 'Senha redefinida e evento enviado.' });
  });
};

// Endpoint para obter dados do usuário autenticado
export const getMe = async (req: Request, res: Response) => {
  // O user_id virá do header x-user-id injetado pelo API Gateway
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ 
      erro: 'nao_autenticado', 
      mensagem: 'Usuário não autenticado' 
    });
  }
  
  try {
    await withClient(async (c) => {
      const { rows } = await c.query(
        `SELECT id, nome, email, cpf, departamento_id, cargo_nome, xp_total, nivel, role, ativo
         FROM user_service.funcionarios
         WHERE id = $1 AND ativo = true`,
        [userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ 
          erro: 'usuario_nao_encontrado', 
          mensagem: 'Usuário não encontrado ou inativo' 
        });
      }
      
      const user = rows[0];
      
      // Retornar dados completos do funcionário
      res.status(200).json({
        id: user.id,
        nome: user.nome,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        departamento_id: user.departamento_id,
        cargo_nome: user.cargo_nome,
        xp_total: user.xp_total,
        nivel: user.nivel,
        ativo: user.ativo
      });
    });
  } catch (error) {
    console.error('[user-service] Erro no /me:', error);
    return res.status(500).json({ 
      erro: 'erro_servidor', 
      mensagem: 'Erro ao buscar dados do usuário' 
    });
  }
};
