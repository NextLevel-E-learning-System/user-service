import { withClient } from '../db.js';

export async function findById(id: string) {
  return withClient(async c => {
    const r = await c.query('select id, nome as name, email, cargo, xp_total, nivel, status from funcionarios where id=$1', [id]);
    return r.rows[0];
  });
}

export async function createUser(data: { id: string; cpf: string; nome: string; email: string; departamento?: string; cargo?: string; }) {
  const { id, cpf, nome, email, departamento, cargo } = data;
  await withClient(c => c.query('insert into funcionarios (id, cpf, nome, email, departamento_id, cargo, xp_total, nivel, status) values ($1,$2,$3,$4,$5,$6,0,$7,$8)', [id, cpf, nome, email, departamento || null, cargo || null, 'Iniciante', 'ATIVO']));
}

export async function updateXp(id: string, delta: number) {
  return withClient(async c => {
    const r = await c.query('update funcionarios set xp_total = xp_total + $1 where id=$2 returning id, xp_total', [delta, id]);
    return r.rows[0];
  });
}