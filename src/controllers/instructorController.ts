import { Request, Response } from "express";
import { withClient } from "../config/db.js";

export interface Instructor {
  funcionario_id: string;
  nome: string;
  email: string;
  cpf?: string;
  departamento_id?: string;
  departamento_nome?: string;
  cargo_nome?: string;
  biografia?: string;
  especialidades?: string[];
  avaliacao_media?: number;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export const listInstructors = async (_req: Request, res: Response) => {
  try {
    await withClient(async (c) => {
      const { rows } = await c.query(`
        SELECT 
          i.funcionario_id,
          f.nome,
          f.email,
          f.cpf,
          f.departamento_id,
          d.nome as departamento_nome,
          f.cargo_nome,
          i.biografia,
          i.especialidades,
          f.ativo,
          i.criado_em,
          i.atualizado_em
        FROM user_service.instrutores i
        INNER JOIN user_service.funcionarios f ON i.funcionario_id = f.id
        LEFT JOIN user_service.departamentos d ON f.departamento_id = d.codigo
        WHERE f.ativo = true
        ORDER BY f.nome ASC
      `);
      
      const instrutores = rows.map(row => ({
        id: row.funcionario_id,
        funcionario_id: row.funcionario_id,
        nome: row.nome,
        email: row.email,
        cpf: row.cpf,
        departamento_id: row.departamento_id,
        departamento_nome: row.departamento_nome,
        cargo_nome: row.cargo_nome,
        biografia: row.biografia,
        especialidades: row.especialidades,
        ativo: row.ativo,
        criado_em: row.criado_em,
        atualizado_em: row.atualizado_em
      }));

      res.json({ 
        items: instrutores, 
        mensagem: 'Instrutores listados com sucesso' 
      });
    });
  } catch (error) {
    console.error('Erro ao listar instrutores:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};

export const getInstructor = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await withClient(async (c) => {
      const { rows } = await c.query(`
        SELECT 
          i.funcionario_id,
          f.nome,
          f.email,
          f.cpf,
          f.departamento_id,
          d.nome as departamento_nome,
          f.cargo_nome,
          i.biografia,
          i.especialidades,
          f.ativo,
          i.criado_em,
          i.atualizado_em
        FROM user_service.instrutores i
        INNER JOIN user_service.funcionarios f ON i.funcionario_id = f.id
        LEFT JOIN user_service.departamentos d ON f.departamento_id = d.codigo
        WHERE i.funcionario_id = $1
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ 
          erro: 'instrutor_nao_encontrado', 
          mensagem: 'Instrutor não encontrado' 
        });
      }

      const instrutor = {
        id: rows[0].funcionario_id,
        funcionario_id: rows[0].funcionario_id,
        nome: rows[0].nome,
        email: rows[0].email,
        cpf: rows[0].cpf,
        departamento_id: rows[0].departamento_id,
        departamento_nome: rows[0].departamento_nome,
        cargo_nome: rows[0].cargo_nome,
        biografia: rows[0].biografia,
        especialidades: rows[0].especialidades,
        ativo: rows[0].ativo,
        criado_em: rows[0].criado_em,
        atualizado_em: rows[0].atualizado_em
      };

      res.json({ 
        instrutor, 
        mensagem: 'Instrutor encontrado com sucesso' 
      });
    });
  } catch (error) {
    console.error('Erro ao buscar instrutor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};

export const createInstructor = async (req: Request, res: Response) => {
  const { funcionario_id, biografia, especialidades } = req.body;
  
  try {
    if (!funcionario_id) {
      return res.status(400).json({ 
        erro: 'dados_invalidos', 
        mensagem: 'ID do funcionário é obrigatório' 
      });
    }

    await withClient(async (c) => {
      // Verificar se o funcionário existe e tem role INSTRUTOR
      const { rows: funcionarioRows } = await c.query(`
        SELECT id, nome, role FROM user_service.funcionarios 
        WHERE id = $1 AND ativo = true
      `, [funcionario_id]);

      if (funcionarioRows.length === 0) {
        return res.status(404).json({ 
          erro: 'funcionario_nao_encontrado', 
          mensagem: 'Funcionário não encontrado' 
        });
      }

      const funcionario = funcionarioRows[0];
      if (funcionario.role !== 'INSTRUTOR') {
        return res.status(400).json({ 
          erro: 'role_invalida', 
          mensagem: 'Funcionário deve ter role INSTRUTOR' 
        });
      }

      // Verificar se já é instrutor
      const { rows: existingRows } = await c.query(`
        SELECT funcionario_id FROM user_service.instrutores 
        WHERE funcionario_id = $1
      `, [funcionario_id]);

      if (existingRows.length > 0) {
        return res.status(409).json({ 
          erro: 'instrutor_ja_existe', 
          mensagem: 'Este funcionário já é um instrutor' 
        });
      }

      // Criar instrutor
      const { rows } = await c.query(`
        INSERT INTO user_service.instrutores
        (funcionario_id, biografia, especialidades)
        VALUES ($1, $2, $3) 
        RETURNING *
      `, [funcionario_id, biografia, especialidades]);

      const novoInstrutor = rows[0];

      res.status(201).json({ 
        instrutor: novoInstrutor, 
        mensagem: 'Instrutor criado com sucesso' 
      });
    });
  } catch (error) {
    console.error('Erro ao criar instrutor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};

export const updateInstructor = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { biografia, especialidades } = req.body;
  
  try {
    await withClient(async (c) => {
      const { rows } = await c.query(`
        UPDATE user_service.instrutores 
        SET 
          biografia = COALESCE($1, biografia),
          especialidades = COALESCE($2, especialidades),
          atualizado_em = NOW()
        WHERE funcionario_id = $3 
        RETURNING *
      `, [biografia, especialidades, id]);

      if (rows.length === 0) {
        return res.status(404).json({ 
          erro: 'instrutor_nao_encontrado', 
          mensagem: 'Instrutor não encontrado' 
        });
      }

      res.json({ 
        instrutor: rows[0], 
        mensagem: 'Instrutor atualizado com sucesso' 
      });
    });
  } catch (error) {
    console.error('Erro ao atualizar instrutor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};

export const deleteInstructor = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await withClient(async (c) => {
      // Iniciar transação
      await c.query('BEGIN');

      try {
        // Deletar da tabela instrutores
        const { rows } = await c.query(`
          DELETE FROM user_service.instrutores 
          WHERE funcionario_id = $1 
          RETURNING *
        `, [id]);

        if (rows.length === 0) {
          await c.query('ROLLBACK');
          return res.status(404).json({ 
            erro: 'instrutor_nao_encontrado', 
            mensagem: 'Instrutor não encontrado' 
          });
        }

        // Atualizar role do funcionário para ALUNO
        await c.query(`
          UPDATE user_service.funcionarios 
          SET 
            role = 'ALUNO',
            atualizado_em = NOW()
          WHERE id = $1
        `, [id]);

        // Commit da transação
        await c.query('COMMIT');

        res.json({ 
          mensagem: 'Instrutor removido com sucesso e role alterada para ALUNO' 
        });
      } catch (txError) {
        await c.query('ROLLBACK');
        throw txError;
      }
    });
  } catch (error) {
    console.error('Erro ao deletar instrutor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};

export const toggleInstructorStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await withClient(async (c) => {
      // Atualizar status na tabela funcionarios
      const { rows } = await c.query(`
        UPDATE user_service.funcionarios 
        SET 
          ativo = NOT ativo,
          atualizado_em = NOW()
        WHERE id = $1 
        RETURNING ativo, nome
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ 
          erro: 'funcionario_nao_encontrado', 
          mensagem: 'Funcionário não encontrado' 
        });
      }

      const { ativo, nome } = rows[0];
      const status = ativo ? 'ativado' : 'desativado';

      res.json({ 
        ativo, 
        mensagem: `Instrutor ${nome} ${status} com sucesso` 
      });
    });
  } catch (error) {
    console.error('Erro ao alternar status do instrutor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ 
      erro: 'erro_interno', 
      mensagem: 'Erro interno do servidor', 
      detalhes: errorMessage 
    });
  }
};