import { withClient } from '../db.js';

export async function findById(id: string) {
  return withClient(async c => {
    const r = await c.query('select id, cpf, nome as name, email, departamento_id, cargo, xp_total, nivel, status from user_service.funcionarios where id=$1', [id]);
    return r.rows[0];
  });
}

export async function updateUser(userId: string, data: { 
  nome: string; 
  cpf: string; 
  email?: string; 
  departamento_id: string; 
  cargo: string; 
}) {
  const { nome, cpf, email, departamento_id, cargo } = data;
  
  // Se email foi fornecido, atualizar também; senão manter o atual
  if (email) {
    await withClient(c => c.query(
      'update user_service.funcionarios set nome=$1, cpf=$2, email=$3, departamento_id=$4, cargo=$5 where id=$6', 
      [nome, cpf, email, departamento_id, cargo, userId]
    ));
  } else {
    await withClient(c => c.query(
      'update user_service.funcionarios set nome=$1, cpf=$2, departamento_id=$3, cargo=$4 where id=$5', 
      [nome, cpf, departamento_id, cargo, userId]
    ));
  }
}

export async function updateXp(id: string, delta: number) {
  return withClient(async c => {
    const r = await c.query('update user_service.funcionarios set xp_total = xp_total + $1 where id=$2 returning id, xp_total', [delta, id]);
    return r.rows[0];
  });
}

export async function findDepartments() {
  return withClient(async c => {
    const r = await c.query('select codigo as id, nome as name, descricao as description from user_service.departamentos order by nome');
    return r.rows;
  });
}

export async function checkDepartmentExists(codigo: string) {
  return withClient(async c => {
    const r = await c.query('select 1 from user_service.departamentos where codigo=$1', [codigo]);
    return (r.rowCount || 0) > 0;
  });
}