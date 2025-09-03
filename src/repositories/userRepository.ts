import { withClient } from '../db.js';

export async function findById(id: string) {
  return withClient(async c => {
    const r = await c.query('select id, nome as name, email, cargo, xp_total, nivel, status from funcionarios where id=$1', [id]);
    return r.rows[0];
  });
}

export async function updateUser(data: {  cpf: string; nome: string;  departamento?: string; cargo?: string; }) {
  const {   cpf, nome,  departamento, cargo } = data;
  await withClient(c => c.query('update funcionarios set cpf=$1, nome=$2, departamento_id=$3, cargo=$4 where id=$5', [cpf, nome, departamento , cargo ]));
}

export async function updateXp(id: string, delta: number) {
  return withClient(async c => {
    const r = await c.query('update funcionarios set xp_total = xp_total + $1 where id=$2 returning id, xp_total', [delta, id]);
    return r.rows[0];
  });
}