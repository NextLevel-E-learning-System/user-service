import { Request, Response } from "express";
import { withClient } from "../config/db.js";

export const listDepartamentos = async (_req: Request, res: Response) => {
  await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT 
        d.codigo,
        d.nome
      FROM user_service.departamentos d
      ORDER BY d.nome
    `);
  res.json({ items: rows, mensagem: 'Departamentos listados com sucesso' });
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
        d.criado_em,
        d.atualizado_em,
        COUNT(func.id) as total_funcionarios,
        COUNT(cat.codigo) as total_categorias
      FROM user_service.departamentos d
      LEFT JOIN user_service.funcionarios f ON d.gestor_funcionario_id = f.id
      LEFT JOIN user_service.funcionarios func ON d.codigo = func.departamento_id AND func.ativo = true
      LEFT JOIN course_service.categorias cat ON d.codigo = cat.departamento_codigo
      GROUP BY d.codigo, d.nome, d.descricao, d.gestor_funcionario_id, f.nome, f.email, d.criado_em, d.atualizado_em
      ORDER BY d.nome
    `);
  res.json({ items: rows, mensagem: 'Departamentos listados com sucesso' });
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
        d.criado_em,
        d.atualizado_em,
        COUNT(func.id) as total_funcionarios,
        COUNT(cat.codigo) as total_categorias
      FROM user_service.departamentos d
      LEFT JOIN user_service.funcionarios f ON d.gestor_funcionario_id = f.id
      LEFT JOIN user_service.funcionarios func ON d.codigo = func.departamento_id AND func.ativo = true
      LEFT JOIN course_service.categorias cat ON d.codigo = cat.departamento_codigo
      WHERE d.codigo = $1
      GROUP BY d.codigo, d.nome, d.descricao, d.gestor_funcionario_id, f.nome, f.email, d.criado_em, d.atualizado_em
    `, [codigo]);
    
    if (rows.length === 0) {
  return res.status(404).json({ erro: 'departamento_nao_encontrado', mensagem: 'Departamento não encontrado' });
    }
    
  res.json({ departamento: rows[0], mensagem: 'Departamento obtido com sucesso' });
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
  res.status(201).json({ departamento: rows[0], mensagem: 'Departamento criado com sucesso' });
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
  res.json({ departamento: rows[0], mensagem: 'Departamento atualizado com sucesso' });
  });
};

export const deleteDepartamento = async (req: Request, res: Response) => {
  const { codigo } = req.params;
  
  await withClient(async (c) => {
    // Verificar se o departamento existe
    const deptCheck = await c.query(
      'SELECT codigo FROM user_service.departamentos WHERE codigo = $1',
      [codigo]
    );
    
    if (deptCheck.rows.length === 0) {
      return res.status(404).json({ erro: 'departamento_nao_encontrado', mensagem: 'Departamento não encontrado' });
    }

    // Verificar se há categorias associadas a este departamento
    const categoriasAssociadas = await c.query(
      'SELECT COUNT(*) as count FROM course_service.categorias WHERE departamento_codigo = $1',
      [codigo]
    );
    
    const totalCategorias = parseInt(categoriasAssociadas.rows[0].count);
    if (totalCategorias > 0) {
      return res.status(409).json({ 
        erro: 'departamento_com_categorias',
        mensagem: `Não é possível excluir departamento que possui ${totalCategorias} categoria(s) associada(s)` 
      });
    }

    // Verificar se há funcionários associados a este departamento
    const funcionariosAssociados = await c.query(
      'SELECT COUNT(*) as count FROM user_service.funcionarios WHERE departamento_id = $1 AND ativo = true',
      [codigo]
    );
    
    const totalFuncionarios = parseInt(funcionariosAssociados.rows[0].count);
    if (totalFuncionarios > 0) {
      return res.status(409).json({ 
        erro: 'departamento_com_funcionarios',
        mensagem: `Não é possível excluir departamento que possui ${totalFuncionarios} funcionário(s) ativo(s)` 
      });
    }

    // Se passou por todas as validações, pode deletar
    await c.query('DELETE FROM user_service.departamentos WHERE codigo = $1', [codigo]);
    res.status(204).send();
  });
};
