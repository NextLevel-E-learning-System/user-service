import { withClient } from '../db.js';

export async function findUsers(filters: {
  id?: string;
  departamento?: string;
  status?: string;
  search?: string;
  tipo_usuario?: string;
  limit?: number;
  offset?: number;
}) {
  return withClient(async c => {
    const conds: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (filters.id) {
      conds.push(`f.id = $${idx++}`);
      values.push(filters.id);
    }

    if (filters.departamento) {
      conds.push(`f.departamento_id = $${idx++}`);
      values.push(filters.departamento);
    }

    if (filters.status) {
      conds.push(`f.status = $${idx++}`);
      values.push(filters.status);
    }

    if (filters.tipo_usuario) {
      conds.push(`u.tipo_usuario = $${idx++}`);
      values.push(filters.tipo_usuario);
    }

    if (filters.search) {
      conds.push(`(unaccent(f.nome) ILIKE unaccent($${idx}) OR unaccent(f.email) ILIKE unaccent($${idx}))`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.length ? 'where ' + conds.join(' and ') : '';
    
    // Se buscando por ID específico, incluir biografia do instrutor
    const biografiaField = filters.id ? ', i.biografia' : '';
    const instructorJoin = filters.id ? 'left join user_service.instrutores i on i.funcionario_id = f.id' : '';
    
    let sql = `select f.id, f.cpf, f.nome, f.email, f.departamento_id, f.cargo, f.xp_total, f.nivel, f.status,
      u.tipo_usuario${biografiaField}`;
    
    // Adicionar count total apenas se não for busca por ID
    if (!filters.id) {
      sql += ', count(*) over() as total';
    }

    sql += ` from user_service.funcionarios f
      left join auth_service.usuarios u on u.id = f.id
      ${instructorJoin}
      ${where}
      order by f.nome`;

    if (filters.limit) {
      sql += ` limit $${idx++}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      sql += ` offset $${idx}`;
      values.push(filters.offset);
    }

    const r = await c.query(sql, values);
    
    // Se buscar por ID específico, retorna um único resultado
    if (filters.id) {
      return r.rows[0] || null;
    }
    
    // Para listagem, retorna com total
    const total = r.rows[0]?.total ? Number(r.rows[0].total) : 0;
    return { items: r.rows.map(({ total: _total, ...rest }) => rest), total };
  });
}

export async function findDepartments(filters?: {
  codigo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return withClient(async c => {
    const conds: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (filters?.codigo) {
      conds.push(`codigo = $${idx++}`);
      values.push(filters.codigo);
    }

    if (filters?.search) {
      conds.push(`(unaccent(nome) ILIKE unaccent($${idx}) OR unaccent(descricao) ILIKE unaccent($${idx}))`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.length ? 'where ' + conds.join(' and ') : '';
    
    let sql = `select codigo, nome, descricao, gestor_id`;
    
    // Se buscar por código específico, retorna um único resultado
    if (!filters?.codigo) {
      sql += ', count(*) over() as total';
    }

    sql += ` from user_service.departamentos ${where} order by nome`;

    if (filters?.limit) {
      sql += ` limit $${idx++}`;
      values.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` offset $${idx}`;
      values.push(filters.offset);
    }

    const r = await c.query(sql, values);
    
    // Se buscar por código específico, retorna um único resultado
    if (filters?.codigo) {
      return r.rows[0] || null;
    }
    
    // Para listagem, retorna com total
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

export async function findCargos(filters?: {
  id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return withClient(async c => {
    const conds: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (filters?.id) {
      conds.push(`id = $${idx++}`);
      values.push(filters.id);
    }

    if (filters?.search) {
      conds.push(`unaccent(nome) ILIKE unaccent($${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.length ? 'where ' + conds.join(' and ') : '';
    
    let sql = `select id, nome`;
    
    // Se buscar por ID específico, retorna um único resultado
    if (!filters?.id) {
      sql += ', count(*) over() as total';
    }

    sql += ` from user_service.cargos ${where} order by nome`;

    if (filters?.limit) {
      sql += ` limit $${idx++}`;
      values.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` offset $${idx}`;
      values.push(filters.offset);
    }

    const r = await c.query(sql, values);
    
    // Se buscar por ID específico, retorna um único resultado
    if (filters?.id) {
      return r.rows[0] || null;
    }
    
    // Para listagem, retorna com total
    const total = r.rows[0]?.total ? Number(r.rows[0].total) : 0;
    return { items: r.rows.map(({ total: _total, ...rest }) => rest), total };
  });
}

export async function createCargo(data: { nome: string }) {
  return withClient(async c => {
    const r = await c.query(
      'insert into user_service.cargos (nome) values ($1) returning id, nome',
      [data.nome]
    );
    return r.rows[0];
  });
}

export async function updateCargo(id: string, data: { nome?: string }) {
  return withClient(async c => {
    const sets: string[] = [];
    const vals: string[] = [];
    let i = 1;
    
    if (data.nome !== undefined) {
      sets.push(`nome=$${i}`);
      vals.push(data.nome);
      i++;
    }
    
    if (sets.length === 0) return null;
    
    vals.push(id);
    const r = await c.query(
      `update user_service.cargos set ${sets.join(', ')} where id=$${i} returning id, nome`,
      vals
    );
    return r.rows[0] || null;
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

// Funções removidas - usar updateUserComposite

export async function updateUserComposite(userId: string, data: { nome?: string; departamento_id?: string; cargo?: string; email?: string; status?: string; tipo_usuario?: string; cpf?: string; }) {
  return withClient(async c => {
    const sets: string[] = []; const vals: (string)[] = []; let i=1;
    if (data.nome !== undefined) { sets.push(`nome=$${i}`); vals.push(data.nome); i++; }
    if (data.departamento_id !== undefined) { sets.push(`departamento_id=$${i}`); vals.push(data.departamento_id); i++; }
    if (data.cargo !== undefined) { sets.push(`cargo=$${i}`); vals.push(data.cargo); i++; }
    if (data.email !== undefined) { sets.push(`email=$${i}`); vals.push(data.email); i++; }
    if (data.status !== undefined) { sets.push(`status=$${i}`); vals.push(data.status); i++; }
    if (data.cpf !== undefined) { sets.push(`cpf=$${i}`); vals.push(data.cpf); i++; }
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

