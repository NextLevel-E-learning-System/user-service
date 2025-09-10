import { HttpError } from '../utils/httpError.js';
import { withClient } from '../db.js';

export async function getDashboardByRole(userId: string, role: string) {
  switch (role) {
    case 'FUNCIONARIO':
      return await getEmployeeDashboard(userId);
    case 'INSTRUTOR':
      return await getInstructorDashboard(userId);
    case 'ADMIN':
      return await getAdminDashboard();
    default:
      throw new HttpError(400, 'invalid_role');
  }
}

// Dashboard do Funcionário
async function getEmployeeDashboard(userId: string) {
  try {
    const dashboardData = await getEmployeeDashboardData(userId);
    
    return {
      dashboard_data: {
        tipo_dashboard: 'funcionario',
        ...dashboardData
      }
    };
  } catch (error) {
    // Retorna dados mínimos em caso de erro
    return {
      dashboard_data: {
        tipo_dashboard: 'funcionario',
        xp_atual: 0,
        nivel_atual: 1,
        proximo_badge: 'Bronze',
        cursos_em_andamento: [],
        cursos_concluidos: [],
        timeline: []
      }
    };
  }
}

// Dashboard do Instrutor
async function getInstructorDashboard(userId: string) {
  try {
    const dashboardData = await getInstructorDashboardData(userId);
    
    return {
      dashboard_data: {
        tipo_dashboard: 'instrutor',
        ...dashboardData
      }
    };
  } catch (error) {
    return {
      dashboard_data: {
        tipo_dashboard: 'instrutor',
        cursos: [],
        pendentes_correcao: 0,
        media_geral_cursos: null,
        total_cursos: 0,
        total_alunos: 0,
        taxa_conclusao_geral: 0
      }
    };
  }
}

// Dashboard Administrativo
async function getAdminDashboard() {
  try {
    const dashboardData = await getAdminDashboardData();
    
    return {
      dashboard_data: {
        tipo_dashboard: 'administrador',
        ...dashboardData
      }
    };
  } catch (error) {
    return {
      dashboard_data: {
        tipo_dashboard: 'administrador',
        metricas_gerais: {
          usuarios_ativos_30d: 0,
          total_usuarios: 0,
          total_cursos: 0,
          taxa_conclusao_geral: 0,
          total_inscricoes_30d: 0
        },
        cursos_populares: [],
        engajamento_departamento: [],
        alertas: []
      }
    };
  }
}

export async function getEmployeeDashboardData(userId: string) {
  return withClient(async c => {
    // XP Total do funcionário
    const xpRow = await c.query(`
      select coalesce(sum(c.xp_oferecido),0) as xp
      from course_service.cursos c
      join progress_service.inscricoes i on i.curso_id=c.codigo
      where i.funcionario_id=$1 and i.status=$2
    `, [userId, 'CONCLUIDO']);
    
    // Cursos em andamento
    const emAndamento = await c.query(`
      select c.codigo, c.titulo, c.descricao, i.progresso_percentual as progresso
      from course_service.cursos c
      join progress_service.inscricoes i on i.curso_id=c.codigo
      where i.funcionario_id=$1 and i.status=$2
      order by i.data_inscricao desc limit 10
    `, [userId, 'EM_ANDAMENTO']);
    
    // Cursos concluídos
    const concluidos = await c.query(`
      select c.codigo, c.titulo, c.descricao, i.data_conclusao, c.xp_oferecido
      from course_service.cursos c
      join progress_service.inscricoes i on i.curso_id=c.codigo
      where i.funcionario_id=$1 and i.status=$2
      order by i.data_conclusao desc nulls last limit 10
    `, [userId, 'CONCLUIDO']);
    
    // Ranking no departamento
    const rankingDept = await c.query(`
      select 
        f.nome,
        f.xp_total,
        row_number() over (order by f.xp_total desc) as posicao
      from user_service.funcionarios f
      where f.departamento_id = (
        select departamento_id from user_service.funcionarios where id = $1
      )
      and f.status = 'ATIVO'
      order by f.xp_total desc
      limit 10
    `, [userId]).catch(() => ({ rows: [] }));

    // Timeline de atividades recentes
    const timeline = await c.query(`
      select 
        'conclusao_curso' as tipo,
        c.titulo as descricao,
        i.data_conclusao as data_evento
      from progress_service.inscricoes i
      join course_service.cursos c on c.codigo = i.curso_id
      where i.funcionario_id = $1 and i.status = 'CONCLUIDO'
      and i.data_conclusao >= current_date - interval '30 days'
      order by i.data_conclusao desc
      limit 5
    `, [userId]).catch(() => ({ rows: [] }));

    const xpAtual = Number(xpRow.rows[0]?.xp || 0);
    
    // Cálculo de nível baseado em XP (exemplo: a cada 1000 XP = 1 nível)
    const nivel = Math.floor(xpAtual / 1000) + 1;
    const xpProximoNivel = nivel * 1000;
    
    // Sistema de badges baseado no nível
    const badges = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
    const proximoBadge = badges[Math.min(nivel - 1, badges.length - 1)];

    // Posição no ranking do departamento
    const funcionarioAtual = await c.query('select nome from user_service.funcionarios where id = $1', [userId]);
    const nomeAtual = funcionarioAtual.rows[0]?.nome;
    const posicaoRanking = rankingDept.rows.find(r => r.nome === nomeAtual)?.posicao || null;

    return {
      xp_atual: xpAtual,
      nivel_atual: nivel,
      xp_proximo_nivel: xpProximoNivel,
      proximo_badge: proximoBadge,
      progresso_nivel: ((xpAtual % 1000) / 1000) * 100,
      ranking_departamento: {
        posicao_atual: posicaoRanking,
        ranking: rankingDept.rows.map(r => ({
          nome: r.nome,
          xp_total: Number(r.xp_total),
          posicao: Number(r.posicao)
        }))
      },
      cursos_em_andamento: emAndamento.rows,
      cursos_concluidos: concluidos.rows,
      timeline: timeline.rows.map(r => ({
        tipo: r.tipo,
        descricao: r.descricao,
        data_evento: r.data_evento
      }))
    };
  });
}

export async function getInstructorDashboardData(userId: string) {
  return withClient(async c => {
    // Estatísticas dos cursos do instrutor
    const stats = await c.query(`
      select 
        c.codigo,
        c.titulo,
        c.ativo,
        (select count(*) from progress_service.inscricoes i where i.curso_id=c.codigo) as inscritos,
        (select count(*) from progress_service.inscricoes i where i.curso_id=c.codigo and i.status='CONCLUIDO') as concluidos,
        case 
          when (select count(*) from progress_service.inscricoes i where i.curso_id=c.codigo)=0 then 0
          else round(((select count(*) from progress_service.inscricoes i where i.curso_id=c.codigo and i.status='CONCLUIDO')::decimal /
               (select count(*) from progress_service.inscricoes i where i.curso_id=c.codigo))*100,2) 
        end as taxa_conclusao,
        null::decimal as avaliacao_media
      from course_service.cursos c 
      where c.instrutor_id=$1 
      order by c.titulo asc
    `, [userId]);
    
    // Avaliações pendentes (integração com assessment-service)
    const pendentesRow = await c.query(`
      select count(*) as total
      from assessment_service.avaliacoes a
      join course_service.cursos c on c.codigo = a.curso_id
      where c.instrutor_id = $1 and a.status = 'PENDENTE'
    `, [userId]).catch(() => ({ rows: [{ total: 0 }] })); // Fallback se não existir

    const cursos = stats.rows.map(r => ({
      codigo: r.codigo,
      titulo: r.titulo,
      ativo: r.ativo,
      inscritos: Number(r.inscritos || 0),
      conclusoes: Number(r.concluidos || 0),
      taxa_conclusao: Number(r.taxa_conclusao || 0),
      avaliacao_media: r.avaliacao_media ? Number(r.avaliacao_media) : null
    }));

    const mediaGeral = cursos.length 
      ? (cursos.reduce((a, c) => a + (c.avaliacao_media || 0), 0) / cursos.length) 
      : null;

    return {
      cursos,
      pendentes_correcao: Number(pendentesRow.rows[0]?.total || 0),
      media_geral_cursos: mediaGeral,
      total_cursos: cursos.length,
      total_alunos: cursos.reduce((sum, curso) => sum + curso.inscritos, 0),
      taxa_conclusao_geral: cursos.length > 0 
        ? (cursos.reduce((sum, curso) => sum + curso.taxa_conclusao, 0) / cursos.length) 
        : 0
    };
  });
}

export async function getAdminDashboardData() {
  return withClient(async c => {
    // Usuários ativos nos últimos 30 dias
    const usuariosAtivos = await c.query(`
      select count(distinct i.funcionario_id) as total
      from progress_service.inscricoes i
      where i.data_inscricao >= current_date - interval '30 days'
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // Total de usuários cadastrados
    const totalUsuarios = await c.query(`
      select count(*) as total from user_service.funcionarios where status = 'ATIVO'
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // Total de cursos ativos
    const totalCursos = await c.query(`
      select count(*) as total from course_service.cursos where ativo = true
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // Taxa de conclusão geral dos últimos 30 dias
    const taxaConclusaoGeral = await c.query(`
      select 
        count(*) as total_inscricoes,
        count(case when status = 'CONCLUIDO' then 1 end) as total_conclusoes,
        case 
          when count(*) = 0 then 0
          else round((count(case when status = 'CONCLUIDO' then 1 end)::decimal / count(*))*100, 2)
        end as taxa_conclusao
      from progress_service.inscricoes
      where data_inscricao >= current_date - interval '30 days'
    `).catch(() => ({ rows: [{ total_inscricoes: 0, total_conclusoes: 0, taxa_conclusao: 0 }] }));

    // Cursos populares (mais inscrições nos últimos 30 dias)
    const cursosPopulares = await c.query(`
      select 
        c.codigo,
        c.titulo,
        count(i.funcionario_id) as total_inscricoes,
        round(avg(case when i.status = 'CONCLUIDO' then 100 else i.progresso_percentual end), 2) as taxa_conclusao_media
      from course_service.cursos c
      join progress_service.inscricoes i on i.curso_id = c.codigo
      where i.data_inscricao >= current_date - interval '30 days'
      group by c.codigo, c.titulo
      order by total_inscricoes desc
      limit 10
    `).catch(() => ({ rows: [] }));

    // Engajamento por departamento
    const engajamentoDepartamento = await c.query(`
      select 
        d.codigo as departamento,
        d.nome as nome_departamento,
        count(distinct f.id) as total_funcionarios,
        count(distinct i.funcionario_id) as funcionarios_ativos,
        count(i.id) as total_inscricoes,
        count(case when i.status = 'CONCLUIDO' then 1 end) as total_conclusoes,
        case 
          when count(i.id) = 0 then 0
          else round((count(case when i.status = 'CONCLUIDO' then 1 end)::decimal / count(i.id))*100, 2)
        end as taxa_conclusao
      from user_service.departamentos d
      left join user_service.funcionarios f on f.departamento_id = d.codigo and f.status = 'ATIVO'
      left join progress_service.inscricoes i on i.funcionario_id = f.id 
        and i.data_inscricao >= current_date - interval '30 days'
      group by d.codigo, d.nome
      order by funcionarios_ativos desc
    `).catch(() => ({ rows: [] }));

    // Cursos com baixa avaliação (simulado - seria via assessment_service)
    const cursosComBaixaAvaliacao = await c.query(`
      select c.codigo, c.titulo
      from course_service.cursos c
      where c.ativo = true
      and exists (
        select 1 from progress_service.inscricoes i 
        where i.curso_id = c.codigo 
        and i.data_inscricao >= current_date - interval '90 days'
      )
      -- TODO: adicionar join com avaliações quando implementado
      limit 5
    `).catch(() => ({ rows: [] }));

    // Instrutores inativos (sem cursos ou sem inscrições recentes)
    const instrutoresInativos = await c.query(`
      select f.nome
      from user_service.funcionarios f
      join user_service.instrutores inst on inst.funcionario_id = f.id
      where f.status = 'ATIVO'
      and not exists (
        select 1 
        from course_service.cursos c 
        join progress_service.inscricoes i on i.curso_id = c.codigo
        where c.instrutor_id = f.id 
        and i.data_inscricao >= current_date - interval '60 days'
      )
      limit 5
    `).catch(() => ({ rows: [] }));

    return {
      metricas_gerais: {
        usuarios_ativos_30d: Number(usuariosAtivos.rows[0]?.total || 0),
        total_usuarios: Number(totalUsuarios.rows[0]?.total || 0),
        total_cursos: Number(totalCursos.rows[0]?.total || 0),
        taxa_conclusao_geral: Number(taxaConclusaoGeral.rows[0]?.taxa_conclusao || 0),
        total_inscricoes_30d: Number(taxaConclusaoGeral.rows[0]?.total_inscricoes || 0)
      },
      cursos_populares: cursosPopulares.rows.map(r => ({
        codigo: r.codigo,
        titulo: r.titulo,
        inscricoes: Number(r.total_inscricoes),
        taxa_conclusao: Number(r.taxa_conclusao_media || 0)
      })),
      engajamento_departamento: engajamentoDepartamento.rows.map(r => ({
        departamento: r.departamento,
        nome_departamento: r.nome_departamento,
        total_funcionarios: Number(r.total_funcionarios || 0),
        funcionarios_ativos: Number(r.funcionarios_ativos || 0),
        total_inscricoes: Number(r.total_inscricoes || 0),
        taxa_conclusao: Number(r.taxa_conclusao || 0)
      })),
      alertas: [
        ...cursosComBaixaAvaliacao.rows.map(r => ({
          tipo: 'Curso necessita atenção',
          descricao: `Curso "${r.titulo}" pode precisar de melhorias`,
          prioridade: 'media' as const
        })),
        ...instrutoresInativos.rows.map(r => ({
          tipo: 'Instrutor inativo',
          descricao: `Instrutor "${r.nome}" sem atividade recente`,
          prioridade: 'baixa' as const
        })),
        ...(Number(taxaConclusaoGeral.rows[0]?.taxa_conclusao || 0) < 70 ? [{
          tipo: 'Taxa de conclusão baixa',
          descricao: `Taxa geral de ${taxaConclusaoGeral.rows[0]?.taxa_conclusao}% está abaixo do ideal (70%)`,
          prioridade: 'alta' as const
        }] : [])
      ]
    };
  });
}
