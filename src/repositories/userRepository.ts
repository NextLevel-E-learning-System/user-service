import { withClient } from '../db.js';

export async function findById(id: string) {
  return withClient(async c => {
    const r = await c.query('select id, cpf, nome, email, departamento_id, cargo, xp_total, nivel, status from user_service.funcionarios where id=$1', [id]);
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

export async function listUsers(params: { departamento?: string; status?: string; search?: string; limit: number; offset: number; }) {
  return withClient(async c => {
    const conds: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;
    if (params.departamento) { conds.push(`f.departamento_id = $${idx++}`); values.push(params.departamento); }
    if (params.status) { conds.push(`f.status = $${idx++}`); values.push(params.status); }
    if (params.search) { conds.push(`(unaccent(f.nome) ILIKE unaccent($${idx}) OR unaccent(f.email) ILIKE unaccent($${idx}))`); values.push(`%${params.search}%`); idx++; }
    const where = conds.length ? 'where ' + conds.join(' and ') : '';
    const sql = `select f.id, f.cpf, f.nome, f.email, f.departamento_id, f.cargo, f.xp_total, f.nivel, f.status,
      u.tipo_usuario, count(*) over() as total
      from user_service.funcionarios f
      left join auth_service.usuarios u on u.id = f.id
      ${where}
      order by f.nome
      limit $${idx++} offset $${idx}`;
    values.push(params.limit, params.offset);
    const r = await c.query(sql, values);
    const total = r.rows[0]?.total ? Number(r.rows[0].total) : 0;
    return { items: r.rows.map(({ total: _total, ...rest }) => rest), total };
  });
}

export async function createDepartment(data: { codigo: string; nome: string; descricao?: string | null; gestor_id?: string | null; }) {
  return withClient(async c => {
    await c.query('insert into user_service.departamentos(codigo, nome, descricao, gestor_id) values ($1,$2,$3,$4)', [data.codigo, data.nome, data.descricao ?? null, data.gestor_id ?? null]);
  });
}

export async function updateDepartment(codigo: string, data: { nome?: string; descricao?: string | null; gestor_id?: string | null; }) {
  return withClient(async c => {
    const sets: string[] = []; const vals: (string | null)[] = []; let i=1;
    if (data.nome !== undefined) { sets.push(`nome=$${i}`); vals.push(data.nome); i++; }
    if (data.descricao !== undefined) { sets.push(`descricao=$${i}`); vals.push(data.descricao); i++; }
    if (data.gestor_id !== undefined) { sets.push(`gestor_id=$${i}`); vals.push(data.gestor_id); i++; }
    if (!sets.length) return;
    vals.push(codigo);
    await c.query(`update user_service.departamentos set ${sets.join(', ')} where codigo=$${i}` , vals);
  });
}

export async function findDepartment(codigo: string) {
  return withClient(async c => {
    const r = await c.query('select codigo, nome, descricao, gestor_id from user_service.departamentos where codigo=$1', [codigo]);
    return r.rows[0];
  });
}

export async function createInstructor(funcionario_id: string, cursos_id: string[], biografia: string | null) {
  return withClient(async c => {
    await c.query('insert into user_service.instrutores(funcionario_id, curso_id, biografia) values ($1,$2,$3) on conflict (funcionario_id) do update set curso_id=excluded.curso_id', [funcionario_id, cursos_id, biografia]);
  });
}

export async function updateInstructorBio(funcionario_id: string, biografia: string | null) {
  return withClient(async c => {
    await c.query('update user_service.instrutores set biografia=$1 where funcionario_id=$2', [biografia, funcionario_id]);
  });
}

export async function setUserStatus(id: string, status: 'ATIVO' | 'INATIVO') {
  return withClient(async c => {
    await c.query('update user_service.funcionarios set status=$1 where id=$2', [status, id]);
  });
}

export async function updateUserEmail(id: string, email: string) {
  return withClient(async c => {
    await c.query('update user_service.funcionarios set email=$1 where id=$2', [email, id]);
  });
}

export async function updateUserType(userId: string, tipo: string) {
  return withClient(async c => {
    await c.query('update auth_service.usuarios set tipo_usuario=$1 where id=$2', [tipo, userId]);
  });
}

export async function updateUserComposite(userId: string, data: { nome?: string; departamento_id?: string; cargo?: string; email?: string; status?: string; tipo_usuario?: string; }) {
  return withClient(async c => {
    const sets: string[] = []; const vals: (string)[] = []; let i=1;
    if (data.nome !== undefined) { sets.push(`nome=$${i}`); vals.push(data.nome); i++; }
    if (data.departamento_id !== undefined) { sets.push(`departamento_id=$${i}`); vals.push(data.departamento_id); i++; }
    if (data.cargo !== undefined) { sets.push(`cargo=$${i}`); vals.push(data.cargo); i++; }
    if (data.email !== undefined) { sets.push(`email=$${i}`); vals.push(data.email); i++; }
    if (data.status !== undefined) { sets.push(`status=$${i}`); vals.push(data.status); i++; }
    if (sets.length) {
      vals.push(userId);
      await c.query(`update user_service.funcionarios set ${sets.join(', ')} where id=$${i}`, vals);
    }
    if (data.tipo_usuario !== undefined) {
      await c.query('update auth_service.usuarios set tipo_usuario=$1 where id=$2', [data.tipo_usuario, userId]);
    }
  });
}

// ========== NOVAS FUNÇÕES PARA DADOS REAIS ==========

export async function findInstructors() {
  return withClient(async c => {
    const r = await c.query(`
      select 
        f.id, f.nome, f.email, f.departamento_id, f.cargo,
        i.biografia, i.curso_id, i.avaliacao_media,
        d.nome as departamento_nome
      from user_service.funcionarios f
      inner join user_service.instrutores i on i.funcionario_id = f.id
      left join user_service.departamentos d on d.codigo = f.departamento_id
      where f.status = 'ATIVO'
      order by f.nome
    `);
    return r.rows;
  });
}

export async function findUserAchievements(userId: string) {
  return withClient(async c => {
    const r = await c.query(`
      select 
        c.id, c.tipo_conquista, c.data_conquista, c.detalhes,
        f.xp_total, f.nivel
      from user_service.conquistas c
      inner join user_service.funcionarios f on f.id = c.funcionario_id
      where c.funcionario_id = $1
      order by c.data_conquista desc
    `, [userId]);
    
    const conquistas = r.rows;
    const userInfo = conquistas[0] || await c.query('select xp_total, nivel from user_service.funcionarios where id = $1', [userId]).then(r => r.rows[0]);
    
    return {
      funcionario_id: userId,
      conquistas: conquistas.map(({ xp_total: _xp, nivel: _nivel, ...conquista }) => conquista),
      total_xp: userInfo?.xp_total || 0,
      nivel_atual: userInfo?.nivel || 1
    };
  });
}

