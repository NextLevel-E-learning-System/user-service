import { Request, Response } from "express";
import { withClient } from "../config/db.js";
// Removido uso de HttpError; respostas padronizadas diretas

// Buscar dados do usuário logado
async function getUserData(funcionarioId: string) {
  return await withClient(async (c) => {
    const { rows } = await c.query(`
      SELECT f.*, d.nome as departamento_nome, c.nome as cargo_nome
      FROM user_service.funcionarios f
      LEFT JOIN user_service.departamentos d ON f.departamento_id = d.codigo
      LEFT JOIN user_service.cargos c ON f.cargo_nome = c.nome
      WHERE f.id = $1 AND f.ativo = true
    `, [funcionarioId]);
    
    return rows[0] || null;
  });
}

export const getDashboard = async (req: Request, res: Response) => {
  try {
    console.log('[dashboard] Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Ler dados do usuário do header x-user-data (base64 encoded JSON)
    let funcionarioId: string | undefined;
    
    try {
      const userDataHeader = req.headers['x-user-data'] as string;
      if (userDataHeader) {
        const userData = JSON.parse(Buffer.from(userDataHeader, 'base64').toString('utf8'));
        funcionarioId = userData.sub;
        console.log('[dashboard] User extracted from x-user-data:', userData);
      } else {
        // Fallback: tentar ler do header x-user-id
        funcionarioId = req.headers['x-user-id'] as string;
        console.log('[dashboard] Fallback: using x-user-id header:', funcionarioId);
      }
    } catch (error) {
      console.error('[dashboard] Error parsing user data from headers:', error);
    }
    
    console.log('[dashboard] Funcionario ID extracted:', funcionarioId);
    
    if (!funcionarioId) {
      console.log('[dashboard] No funcionario ID found, returning 401');
  return res.status(401).json({ erro: 'user_not_authenticated', mensagem: 'Usuário não autenticado' });
    }

    // Buscar dados do usuário
    const userData = await getUserData(funcionarioId);
    if (!userData) {
  return res.status(404).json({ erro: 'user_not_found', mensagem: 'Usuário não encontrado' });
    }

    // Determinar role principal (direto do campo role)
    const mainRole = userData.role || 'FUNCIONARIO';

    // Gerar dashboard baseado na role
    let dashboardData;
    switch (mainRole) {
      case 'ADMIN':
        dashboardData = await getAdminDashboard(userData);
        break;
      case 'INSTRUTOR':
        dashboardData = await getInstructorDashboard(userData);
        break;
      case 'GERENTE':
        // GERENTE usa o mesmo dashboard que ADMIN, mas filtrado por departamento
        dashboardData = await getGerenteDashboard(userData);
        break;
    }

    res.json({
      usuario: {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        departamento: userData.departamento_nome,
        cargo: userData.cargo_nome,
        nivel: userData.nivel,
        xp_total: userData.xp_total,
        role: userData.role
      },
      dashboard: dashboardData,
      mensagem: 'Dashboard carregado com sucesso'
    });

  } catch (error) {
    console.error('[dashboard] Error getting dashboard:', error);
    res.status(500).json({ erro: 'internal_server_error', mensagem: 'Erro interno ao gerar dashboard' });
  }
};

// Dashboard do Instrutor - Apenas métricas gerais
async function getInstructorDashboard(userData: { id: string }) {
  try {
    const dashboardData = await withClient(async (c) => {
      // 1. Buscar avaliações pendentes de correção
      const pendentesResult = await c.query(`
        SELECT COUNT(*) as pendentes
        FROM assessment_service.tentativas t
        JOIN assessment_service.avaliacoes a ON t.avaliacao_id = a.codigo
        JOIN course_service.cursos c ON a.curso_id = c.codigo
        WHERE c.instrutor_id = $1 
        AND t.status = 'AGUARDANDO_CORRECAO'
      `, [userData.id]);

      // 2. Calcular métricas gerais
      const metricasResult = await c.query(`
        SELECT 
          COUNT(DISTINCT c.codigo) as total_cursos,
          COUNT(DISTINCT i.funcionario_id) as total_alunos,
          COALESCE(
            ROUND(
              AVG(
                CASE 
                  WHEN curso_stats.total_inscricoes > 0 
                  THEN (curso_stats.total_conclusoes::numeric / curso_stats.total_inscricoes) * 100
                  ELSE 0
                END
              ), 
              1
            ), 
            0
          ) as taxa_conclusao_geral,
          COALESCE(ROUND(AVG(t.nota_obtida), 1), 0) as avaliacao_media_geral
        FROM course_service.cursos c
        LEFT JOIN progress_service.inscricoes i ON c.codigo = i.curso_id
        LEFT JOIN assessment_service.avaliacoes a ON c.codigo = a.curso_id
        LEFT JOIN assessment_service.tentativas t ON a.codigo = t.avaliacao_id AND t.funcionario_id = i.funcionario_id AND t.status = 'APROVADO'
        LEFT JOIN (
          SELECT 
            curso_id,
            COUNT(*) as total_inscricoes,
            COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END) as total_conclusoes
          FROM progress_service.inscricoes
          GROUP BY curso_id
        ) curso_stats ON c.codigo = curso_stats.curso_id
        WHERE c.instrutor_id = $1
      `, [userData.id]);

      return {
        pendentes: pendentesResult.rows[0]?.pendentes || 0,
        metricas: metricasResult.rows[0]
      };
    });

    const { pendentes, metricas } = dashboardData;

    return {
      tipo_dashboard: 'instrutor',
      metricas: {
        total_cursos: parseInt(metricas?.total_cursos || '0'),
        total_alunos: parseInt(metricas?.total_alunos || '0'),
        taxa_conclusao_geral: parseFloat(metricas?.taxa_conclusao_geral || '0'),
        avaliacao_media_geral: parseFloat(metricas?.avaliacao_media_geral || '0'),
        pendentes_correcao: parseInt(pendentes.toString())
      }
    };
  } catch (error) {
    console.error('[dashboard] Error getting instructor dashboard:', error);
    return {
      tipo_dashboard: 'instrutor',
      metricas: { 
        total_cursos: 0, 
        total_alunos: 0, 
        taxa_conclusao_geral: 0,
        avaliacao_media_geral: 0,
        pendentes_correcao: 0
      }
    };
  }
}

// Dashboard do Gerente (mesmo formato que ADMIN, mas filtrado por departamento)
async function getGerenteDashboard(userData: { departamento_id?: string; departamento_nome?: string }) {
  try {
    const dashboardData = await withClient(async (c) => {
      // 1. Estatísticas do departamento específico
      const departmentStatsResult = await c.query(`
        SELECT 
          COUNT(DISTINCT i.id) as total_inscricoes,
          COUNT(DISTINCT CASE WHEN i.status = 'CONCLUIDO' THEN i.id END) as total_conclusoes,
          COALESCE(
            ROUND(
              (COUNT(DISTINCT CASE WHEN i.status = 'CONCLUIDO' THEN i.id END)::numeric / 
               NULLIF(COUNT(DISTINCT i.id), 0)) * 100, 
              1
            ), 
            0
          ) as taxa_conclusao,
          COUNT(DISTINCT CASE WHEN i.data_inscricao >= CURRENT_DATE - INTERVAL '30 days' THEN i.id END) as inscricoes_30d,
          AVG(t.nota_obtida) as avaliacao_media
        FROM progress_service.inscricoes i
        JOIN course_service.cursos c ON i.curso_id = c.codigo
        LEFT JOIN assessment_service.avaliacoes a ON c.codigo = a.curso_id
        LEFT JOIN assessment_service.tentativas t ON a.codigo = t.avaliacao_id AND t.funcionario_id = i.funcionario_id AND t.status = 'APROVADO'
        JOIN user_service.funcionarios f ON i.funcionario_id = f.id
        WHERE f.departamento_id = $1
      `, [userData.departamento_id]);

      // 2. Funcionários do departamento
      const departmentUsersResult = await c.query(`
        SELECT 
          COUNT(*) as total_funcionarios,
          COUNT(CASE WHEN f.ativo = true THEN 1 END) as funcionarios_ativos,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'FUNCIONARIO' THEN 1 END) as alunos_ativos,
          COUNT(CASE WHEN f.role = 'INSTRUTOR' THEN 1 END) as total_instrutores
        FROM user_service.funcionarios f
        JOIN auth_service.usuarios u ON f.id = u.funcionario_id
        WHERE f.departamento_id = $1
      `, [userData.departamento_id]);

      // 3. Cursos relacionados ao departamento
      const departmentCoursesResult = await c.query(`
        SELECT 
          COUNT(DISTINCT c.codigo) as total_cursos,
          COUNT(DISTINCT CASE WHEN c.ativo = true THEN c.codigo END) as cursos_ativos
        FROM course_service.cursos c
        JOIN course_service.categorias cat ON c.categoria_id = cat.codigo
        WHERE cat.departamento_codigo = $1
      `, [userData.departamento_id]);

      // 4. Engajamento do departamento específico
      const departmentEngagementResult = await c.query(`
        SELECT 
          d.codigo,
          d.nome,
          COUNT(f.id) as total_funcionarios,
          COALESCE(AVG(f.xp_total), 0) as xp_medio,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'FUNCIONARIO' THEN 1 END) as funcionarios_ativos
        FROM user_service.departamentos d
        LEFT JOIN user_service.funcionarios f ON d.codigo = f.departamento_id
        WHERE d.codigo = $1 AND d.ativo = true
        GROUP BY d.codigo, d.nome
      `, [userData.departamento_id]);

      return {
        departmentStats: departmentStatsResult.rows[0] || {},
        departmentUsers: departmentUsersResult.rows[0] || {},
        departmentCourses: departmentCoursesResult.rows[0] || {},
        departmentEngagement: departmentEngagementResult.rows
      };
    });

    const { departmentStats, departmentUsers, departmentCourses, departmentEngagement } = dashboardData;

    return {
      tipo_dashboard: 'gerente', // Mesmo tipo que ADMIN para compatibilidade
      metricas_gerais: {
        total_funcionarios: parseInt(departmentUsers?.total_funcionarios || '0'),
        funcionarios_ativos: parseInt(departmentUsers?.funcionarios_ativos || '0'),
        total_instrutores: parseInt(departmentUsers?.total_instrutores || '0'),
        total_cursos: parseInt(departmentCourses?.total_cursos || '0'),
        taxa_conclusao_geral: parseFloat(departmentStats?.taxa_conclusao || '0'),
        inscricoes_30d: parseInt(departmentStats?.inscricoes_30d || '0'),
      },
      engajamento_departamentos: departmentEngagement.map((dept: { 
        codigo: string;
        nome: string;
        total_funcionarios: string; 
        xp_medio: number; 
        funcionarios_ativos: string 
      }) => ({
        codigo: dept.codigo,
        nome: dept.nome,
        total_funcionarios: parseInt(dept.total_funcionarios),
        xp_medio: Math.round(dept.xp_medio || 0),
        funcionarios_ativos: parseInt(dept.funcionarios_ativos)
      })),
    };
  } catch (error) {
    console.error('[dashboard] Error getting gerente dashboard:', error);
    return {
      tipo_dashboard: 'gerente',
      metricas_gerais: {
        total_funcionarios: 0,
        funcionarios_ativos: 0,
        total_cursos: 0,
        taxa_conclusao_geral: 0
      },
      engajamento_departamentos: [],
    };
  }
}

// Dashboard do Administrador
async function getAdminDashboard(_userData: Record<string, unknown>) {
  try {
    const dashboardData = await withClient(async (c) => {
      // 1. Estatísticas gerais de usuários
      const usersStatsResult = await c.query(`
        SELECT 
          COUNT(*) as total_funcionarios,
          COUNT(CASE WHEN f.ativo = true THEN 1 END) as funcionarios_ativos,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'FUNCIONARIO' THEN 1 END) as alunos_ativos,
          COUNT(CASE WHEN f.role = 'INSTRUTOR' THEN 1 END) as total_instrutores
        FROM user_service.funcionarios f
        JOIN auth_service.usuarios u ON f.id = u.funcionario_id
      `);

      // 2. Estatísticas de cursos
      const coursesStatsResult = await c.query(`
        SELECT 
          COUNT(*) as total_cursos,
          COUNT(CASE WHEN ativo = true THEN 1 END) as cursos_ativos
        FROM course_service.cursos
      `);

      // 3. Estatísticas de progresso
      const progressStatsResult = await c.query(`
        SELECT 
          COUNT(*) as total_inscricoes,
          COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END) as total_conclusoes,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN status = 'CONCLUIDO' THEN 1 END)::numeric / 
               NULLIF(COUNT(*), 0)) * 100, 
              1
            ), 
            0
          ) as taxa_conclusao_media,
          COUNT(CASE WHEN data_inscricao >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as inscricoes_30d
        FROM progress_service.inscricoes
      `);

      // 4. Engajamento por departamento
      const departmentEngagementResult = await c.query(`
        SELECT 
          d.codigo,
          d.nome,
          COUNT(f.id) as total_funcionarios,
          COALESCE(AVG(f.xp_total), 0) as xp_medio,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'FUNCIONARIO' THEN 1 END) as funcionarios_ativos
        FROM user_service.departamentos d
        LEFT JOIN user_service.funcionarios f ON d.codigo = f.departamento_id
        WHERE d.ativo = true
        GROUP BY d.codigo, d.nome
        ORDER BY xp_medio DESC NULLS LAST
      `);

      // 5. Cursos populares (por número de inscrições)
      const cursosPopularesResult = await c.query(`
        SELECT 
          c.codigo,
          c.titulo,
          c.ativo,
          COUNT(i.id) as total_inscricoes,
          COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END) as total_conclusoes,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN i.status = 'CONCLUIDO' THEN 1 END)::numeric / 
               NULLIF(COUNT(i.id), 0)) * 100, 
              1
            ), 
            0
          ) as taxa_conclusao
        FROM course_service.cursos c
        LEFT JOIN progress_service.inscricoes i ON c.codigo = i.curso_id
        WHERE c.ativo = true
        GROUP BY c.codigo, c.titulo, c.ativo
        ORDER BY total_inscricoes DESC
        LIMIT 5
      `);

      return {
        usersStats: usersStatsResult.rows[0],
        coursesStats: coursesStatsResult.rows[0],
        progressStats: progressStatsResult.rows[0],
        departmentEngagement: departmentEngagementResult.rows,
        cursosPopulares: cursosPopularesResult.rows
      };
    });

    const { usersStats, coursesStats, progressStats, departmentEngagement, cursosPopulares } = dashboardData;

    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        total_funcionarios: parseInt(usersStats?.total_funcionarios || '0'),
        funcionarios_ativos: parseInt(usersStats?.funcionarios_ativos || '0'),
        total_instrutores: parseInt(usersStats?.total_instrutores || '0'),
        total_cursos: parseInt(coursesStats?.total_cursos || '0'),
        taxa_conclusao_media: parseFloat(progressStats?.taxa_conclusao_media || '0'),
        inscricoes_30d: parseInt(progressStats?.inscricoes_30d || '0'),
      },
      engajamento_departamentos: departmentEngagement.map((dept: { 
        codigo: string;
        nome: string;
        total_funcionarios: string; 
        xp_medio: number; 
        funcionarios_ativos: string 
      }) => ({
        codigo: dept.codigo,
        nome: dept.nome,
        total_funcionarios: parseInt(dept.total_funcionarios),
        xp_medio: Math.round(dept.xp_medio || 0),
        funcionarios_ativos: parseInt(dept.funcionarios_ativos)
      })),
      cursos_populares: cursosPopulares.map((curso: {
        codigo: string;
        titulo: string;
        ativo: boolean;
        total_inscricoes: string;
        total_conclusoes: string;
        taxa_conclusao: string;
      }) => ({
        codigo: curso.codigo,
        titulo: curso.titulo,
        ativo: curso.ativo,
        total_inscricoes: parseInt(curso.total_inscricoes),
        total_conclusoes: parseInt(curso.total_conclusoes),
        taxa_conclusao: parseFloat(curso.taxa_conclusao)
      }))
    };
  } catch (error) {
    console.error('[dashboard] Error getting admin dashboard:', error);
    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        total_funcionarios: 0,
        funcionarios_ativos: 0,
        alunos_ativos: 0,
        total_cursos: 0,
        taxa_conclusao_geral: 0
      },
      engajamento_departamentos: [],
      cursos_populares: [],
      alertas: []
    };
  }
}