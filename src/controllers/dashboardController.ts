import { Request, Response } from "express";
import { withClient } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";

// URLs dos outros microserviços
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3333';
const PROGRESS_SERVICE_URL = process.env.PROGRESS_SERVICE_URL || 'http://progress-service:3333';
const GAMIFICATION_SERVICE_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://gamification-service:3333';
const ASSESSMENT_SERVICE_URL = process.env.ASSESSMENT_SERVICE_URL || 'http://assessment-service:3333';

// Helper para fazer chamadas HTTP entre microserviços
async function fetchFromService(url: string, headers: Record<string, string> = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    if (!response.ok) {
      console.warn(`[dashboard] Service call failed: ${url} - Status: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[dashboard] Service call error: ${url}`, error);
    return null;
  }
}

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
      throw new HttpError(401, 'user_not_authenticated');
    }

    // Buscar dados do usuário
    const userData = await getUserData(funcionarioId);
    if (!userData) {
      throw new HttpError(404, 'user_not_found');
    }

    // Determinar role principal (direto do campo role)
    const mainRole = userData.role || 'ALUNO';

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
      default: // ALUNO ou qualquer outra role
        dashboardData = await getEmployeeDashboard(userData);
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
        roles: [userData.role || 'ALUNO']
      },
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('[dashboard] Error getting dashboard:', error);
    if (error instanceof HttpError) {
      return res.status(error.status || 400).json({ error: error.message });
    }
    res.status(500).json({ error: 'internal_server_error' });
  }
};

// Dashboard do Funcionário/Aluno
async function getEmployeeDashboard(userData: { id: string; xp_total?: number; departamento_id?: string }) {
  try {
    // Buscar progresso no progress-service
    const progressData = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/user/${userData.id}/dashboard`
    );

    // Buscar gamificação
    const gamificationData = await fetchFromService(
      `${GAMIFICATION_SERVICE_URL}/gamification/v1/user/${userData.id}/stats`
    );

    // Buscar catálogo de cursos
    const catalogData = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/catalogo?departamento=${userData.departamento_id}`
    );

    // Calcular progressão de nível
    const xpAtual = userData.xp_total || 0;
    const nivel = Math.floor(xpAtual / 1000) + 1;
    const xpProximoNivel = nivel * 1000;
    const progressoNivel = ((xpAtual % 1000) / 1000) * 100;

    return {
      tipo_dashboard: 'aluno',
      progressao: {
        xp_atual: xpAtual,
        nivel_atual: nivel,
        xp_proximo_nivel: xpProximoNivel,
        progresso_nivel: Math.round(progressoNivel),
        badges_conquistados: gamificationData?.badges || []
      },
      cursos: {
        em_andamento: progressData?.cursos_em_andamento || [],
        concluidos: progressData?.cursos_concluidos || [],
        recomendados: catalogData?.cursos_recomendados || [],
        populares: catalogData?.cursos_populares || []
      },
      ranking: {
        posicao_departamento: gamificationData?.ranking_departamento?.posicao || null,
        total_departamento: gamificationData?.ranking_departamento?.total || null,
        posicao_geral: gamificationData?.ranking_geral?.posicao || null
      },
      atividades_recentes: progressData?.atividades_recentes || []
    };
  } catch (error) {
    console.error('[dashboard] Error getting employee dashboard:', error);
    return {
      tipo_dashboard: 'aluno',
      progressao: { xp_atual: 0, nivel_atual: 1, progresso_nivel: 0 },
      cursos: { em_andamento: [], concluidos: [], recomendados: [] },
      ranking: {},
      atividades_recentes: []
    };
  }
}

// Dashboard do Instrutor
async function getInstructorDashboard(userData: { id: string }) {
  try {
    // Buscar cursos do instrutor
    const coursesData = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/instructor/${userData.id}/courses`
    );

    // Buscar avaliações pendentes
    const assessmentsData = await fetchFromService(
      `${ASSESSMENT_SERVICE_URL}/assessments/v1/instructor/${userData.id}/pending`
    );

    // Buscar estatísticas de progresso
    const progressStats = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/instructor/${userData.id}/stats`
    );

    const cursos = coursesData?.cursos || [];
    const pendentesCorrecao = assessmentsData?.pendentes || 0;

    // Calcular métricas
    const totalAlunos = cursos.reduce((sum: number, curso: { total_inscricoes?: number }) => sum + (curso.total_inscricoes || 0), 0);
    const taxaConclusaoGeral = progressStats?.taxa_conclusao_geral || 0;
    const avaliacaoMediaGeral = progressStats?.avaliacao_media_geral || 0;

    // Gerar alertas
    const alertas = [];
    if (taxaConclusaoGeral < 70) {
      alertas.push({
        tipo: 'Taxa de conclusão baixa',
        descricao: `Taxa geral de ${taxaConclusaoGeral}% está abaixo do ideal (70%)`,
        prioridade: 'alta'
      });
    }
    if (pendentesCorrecao > 10) {
      alertas.push({
        tipo: 'Muitas avaliações pendentes',
        descricao: `${pendentesCorrecao} avaliações aguardando correção`,
        prioridade: 'media'
      });
    }

    return {
      tipo_dashboard: 'instrutor',
      metricas: {
        total_cursos: cursos.length,
        total_alunos: totalAlunos,
        taxa_conclusao_geral: taxaConclusaoGeral,
        avaliacao_media_geral: avaliacaoMediaGeral,
        pendentes_correcao: pendentesCorrecao
      },
      cursos: cursos.map((curso: { 
        codigo?: string; 
        titulo?: string; 
        total_inscricoes?: number; 
        total_conclusoes?: number; 
        taxa_conclusao?: number; 
        avaliacao_media?: number; 
        ativo?: boolean 
      }) => ({
        codigo: curso.codigo,
        titulo: curso.titulo,
        inscritos: curso.total_inscricoes || 0,
        concluidos: curso.total_conclusoes || 0,
        taxa_conclusao: curso.taxa_conclusao || 0,
        avaliacao_media: curso.avaliacao_media || null,
        status: curso.ativo ? 'Ativo' : 'Inativo'
      })),
      alertas,
      atividades_recentes: progressStats?.atividades_recentes || []
    };
  } catch (error) {
    console.error('[dashboard] Error getting instructor dashboard:', error);
    return {
      tipo_dashboard: 'instrutor',
      metricas: { total_cursos: 0, total_alunos: 0 },
      cursos: [],
      alertas: [],
      atividades_recentes: []
    };
  }
}

// Dashboard do Gerente (mesmo formato que ADMIN, mas filtrado por departamento)
async function getGerenteDashboard(userData: { departamento_id?: string; departamento_nome?: string }) {
  try {
    // Buscar estatísticas do departamento específico
    const departmentStats = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/department/${userData.departamento_id}/stats`
    );

    // Buscar funcionários do departamento
    const departmentUsers = await withClient(async (c) => {
      const { rows } = await c.query(`
        SELECT 
          COUNT(*) as total_funcionarios,
          COUNT(CASE WHEN f.ativo = true THEN 1 END) as funcionarios_ativos,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'ALUNO' THEN 1 END) as alunos_ativos,
          COUNT(CASE WHEN f.role = 'INSTRUTOR' THEN 1 END) as total_instrutores
        FROM user_service.funcionarios f
        JOIN auth_service.usuarios u ON f.id = u.funcionario_id
        WHERE f.departamento_id = $1
      `, [userData.departamento_id]);
      return rows[0];
    });

    // Buscar cursos do departamento
    const departmentCourses = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/department/${userData.departamento_id}/stats`
    );

    // Buscar engajamento detalhado do departamento
    const departmentEngagement = await withClient(async (c) => {
      const { rows } = await c.query(`
        SELECT 
          d.codigo,
          d.nome,
          COUNT(f.id) as total_funcionarios,
          AVG(f.xp_total) as xp_medio,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'ALUNO' THEN 1 END) as funcionarios_ativos
        FROM user_service.departamentos d
        LEFT JOIN user_service.funcionarios f ON d.codigo = f.departamento_id
        WHERE d.codigo = $1 AND d.ativo = true
        GROUP BY d.codigo, d.nome
      `, [userData.departamento_id]);
      return rows;
    });

    // Gerar alertas do departamento
    const alertas = [];
    const taxaConclusao = departmentStats?.taxa_conclusao || 0;
    if (taxaConclusao < 70) {
      alertas.push({
        tipo: 'Taxa de conclusão baixa',
        descricao: `Taxa do departamento ${userData.departamento_nome}: ${taxaConclusao}% está abaixo do ideal`,
        prioridade: 'alta'
      });
    }

    return {
      tipo_dashboard: 'administrador', // Mesmo tipo que ADMIN para compatibilidade
      metricas_gerais: {
        total_funcionarios: departmentUsers?.total_funcionarios || 0,
        funcionarios_ativos: departmentUsers?.funcionarios_ativos || 0,
        alunos_ativos: departmentUsers?.alunos_ativos || 0,
        total_instrutores: departmentUsers?.total_instrutores || 0,
        total_cursos: departmentCourses?.total_cursos || 0,
        taxa_conclusao_geral: taxaConclusao,
        inscricoes_30d: departmentStats?.inscricoes_30d || 0,
        avaliacao_media_plataforma: departmentStats?.avaliacao_media || 0
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
      cursos_populares: departmentCourses?.cursos_populares || [],
      alertas,
      // Adicionar flag para indicar que é um gerente
      _departamento_restrito: {
        departamento_id: userData.departamento_id,
        departamento_nome: userData.departamento_nome
      }
    };
  } catch (error) {
    console.error('[dashboard] Error getting gerente dashboard:', error);
    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        total_usuarios: 0,
        usuarios_ativos_30d: 0,
        total_cursos: 0,
        taxa_conclusao_geral: 0
      },
      engajamento_departamentos: [],
      alertas: []
    };
  }
}

// Dashboard do Administrador
async function getAdminDashboard(_userData: Record<string, unknown>) {
  try {
    // Buscar estatísticas gerais de todos os serviços
    const [usersStats, coursesStats, progressStats, assessmentsStats] = await Promise.all([
      withClient(async (c) => {
        const { rows } = await c.query(`
          SELECT 
            COUNT(*) as total_funcionarios,
            COUNT(CASE WHEN f.ativo = true THEN 1 END) as funcionarios_ativos,
            COUNT(CASE WHEN f.ativo = true AND f.role = 'ALUNO' THEN 1 END) as alunos_ativos,
            COUNT(CASE WHEN f.role = 'INSTRUTOR' THEN 1 END) as total_instrutores
          FROM user_service.funcionarios f
          JOIN auth_service.usuarios u ON f.id = u.funcionario_id
        `);
        return rows[0];
      }),
      fetchFromService(`${COURSE_SERVICE_URL}/courses/v1/admin/stats`),
      fetchFromService(`${PROGRESS_SERVICE_URL}/progress/v1/admin/stats`),
      fetchFromService(`${ASSESSMENT_SERVICE_URL}/assessments/v1/admin/stats`)
    ]);

    // Buscar engajamento por departamento
    const departmentEngagement = await withClient(async (c) => {
      const { rows } = await c.query(`
        SELECT 
          d.codigo,
          d.nome,
          COUNT(f.id) as total_funcionarios,
          AVG(f.xp_total) as xp_medio,
          COUNT(CASE WHEN f.ativo = true AND f.role = 'ALUNO' THEN 1 END) as funcionarios_ativos
        FROM user_service.departamentos d
        LEFT JOIN user_service.funcionarios f ON d.codigo = f.departamento_id
        WHERE d.ativo = true
        GROUP BY d.codigo, d.nome
        ORDER BY xp_medio DESC NULLS LAST
      `);
      return rows;
    });

    // Gerar alertas do sistema
    const alertas = [];
    const taxaConclusaoGeral = progressStats?.taxa_conclusao_geral || 0;
    if (taxaConclusaoGeral < 70) {
      alertas.push({
        tipo: 'Taxa de conclusão baixa',
        descricao: `Taxa geral de ${taxaConclusaoGeral}% está abaixo do ideal`,
        prioridade: 'alta'
      });
    }

    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        total_funcionarios: usersStats?.total_funcionarios || 0,
        funcionarios_ativos: usersStats?.funcionarios_ativos || 0,
        alunos_ativos: usersStats?.alunos_ativos || 0,
        total_instrutores: usersStats?.total_instrutores || 0,
        total_cursos: coursesStats?.total_cursos || 0,
        taxa_conclusao_geral: taxaConclusaoGeral,
        inscricoes_30d: progressStats?.inscricoes_30d || 0,
        avaliacao_media_plataforma: assessmentsStats?.avaliacao_media || 0
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
      cursos_populares: coursesStats?.cursos_populares || [],
      alertas
    };
  } catch (error) {
    console.error('[dashboard] Error getting admin dashboard:', error);
    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        total_usuarios: 0,
        usuarios_ativos_30d: 0,
        total_cursos: 0,
        taxa_conclusao_geral: 0
      },
      engajamento_departamentos: [],
      alertas: []
    };
  }
}