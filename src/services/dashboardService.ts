import { HttpError } from '../utils/httpError.js';
import { logger } from '../config/logger.js';

// URLs dos outros microserviços
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:3333';
const PROGRESS_SERVICE_URL = process.env.PROGRESS_SERVICE_URL || 'http://progress-service:3333';
const GAMIFICATION_SERVICE_URL = process.env.GAMIFICATION_SERVICE_URL || 'http://gamification-service:3333';
const ASSESSMENT_SERVICE_URL = process.env.ASSESSMENT_SERVICE_URL || 'http://assessment-service:3333';

// Helper para fazer chamadas HTTP entre microserviços
async function fetchFromService(url: string, headers: Record<string, string> = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    if (!response.ok) {
      logger.warn({ url, status: response.status }, 'Service call failed');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    logger.error({ error, url }, 'Service call error');
    return null;
  }
}

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

// R03: Dashboard do Funcionário
async function getEmployeeDashboard(userId: string) {
  try {
    // Buscar dados do usuário no progress-service
    const progressData = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/user/${userId}/dashboard`
    );

    // Buscar XP e gamificação
    const gamificationData = await fetchFromService(
      `${GAMIFICATION_SERVICE_URL}/gamification/v1/user/${userId}/stats`
    );

    // Buscar cursos disponíveis no course-service
    const catalogData = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/catalogo?userId=${userId}`
    );

    // Calcular nível baseado em XP
    const xpAtual = progressData?.xp_total || 0;
    const nivel = Math.floor(xpAtual / 1000) + 1;
    const xpProximoNivel = nivel * 1000;
    
    // Sistema de badges
    const badges = ['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'];
    const proximoBadge = badges[Math.min(nivel - 1, badges.length - 1)];

    return {
      tipo_dashboard: 'funcionario',
      xp_atual: xpAtual,
      nivel_atual: nivel,
      xp_proximo_nivel: xpProximoNivel,
      proximo_badge: proximoBadge,
      progresso_nivel: ((xpAtual % 1000) / 1000) * 100,
      ranking_departamento: gamificationData?.ranking_departamento || null,
      cursos_em_andamento: progressData?.cursos_em_andamento || [],
      cursos_concluidos: progressData?.cursos_concluidos || [],
      cursos_disponiveis: catalogData?.cursos_disponiveis || [],
      timeline: progressData?.timeline || [],
      badges_conquistados: gamificationData?.badges || [],
      menu_operacoes: [
        { nome: 'Catálogo de Cursos', url: '/catalogo', icone: 'book' },
        { nome: 'Meus Cursos', url: '/meus-cursos', icone: 'graduation-cap' },
        { nome: 'Ranking', url: '/ranking', icone: 'trophy' },
        { nome: 'Perfil', url: '/perfil', icone: 'user' }
      ]
    };
  } catch (error) {
    logger.error({ error, userId }, 'Error getting employee dashboard');
    // Retorna dados mínimos em caso de erro
    return {
      tipo_dashboard: 'funcionario',
      xp_atual: 0,
      nivel_atual: 1,
      proximo_badge: 'Bronze',
      cursos_em_andamento: [],
      cursos_concluidos: [],
      cursos_disponiveis: [],
      timeline: []
    };
  }
}

// R11: Dashboard do Instrutor
async function getInstructorDashboard(userId: string) {
  try {
    // Buscar cursos que o instrutor ministra
    const coursesData = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/instructor/${userId}/courses`
    );

    // Buscar avaliações pendentes
    const assessmentsData = await fetchFromService(
      `${ASSESSMENT_SERVICE_URL}/assessments/v1/instructor/${userId}/pending`
    );

    // Buscar estatísticas de progresso dos alunos
    const progressStats = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/instructor/${userId}/stats`
    );

    const cursos = coursesData?.cursos || [];
    const pendentesCorrecao = assessmentsData?.pendentes || 0;
    const taxaConclusaoGeral = progressStats?.taxa_conclusao_geral || 0;
    const avaliacaoMediaGeral = progressStats?.avaliacao_media_geral || 0;

    return {
      tipo_dashboard: 'instrutor',
      cursos: cursos.map((curso: any) => ({
        codigo: curso.codigo,
        titulo: curso.titulo,
        inscritos: curso.total_inscricoes || 0,
        concluidos: curso.total_conclusoes || 0,
        taxa_conclusao: curso.taxa_conclusao || 0,
        avaliacao_media: curso.avaliacao_media || null,
        status: curso.ativo ? 'Ativo' : 'Inativo'
      })),
      pendentes_correcao: pendentesCorrecao,
      metricas: {
        taxa_conclusao_geral: taxaConclusaoGeral,
        avaliacao_media_geral: avaliacaoMediaGeral,
        total_cursos: cursos.length,
        total_alunos: cursos.reduce((sum: number, curso: any) => sum + (curso.total_inscricoes || 0), 0)
      },
      alertas: [
        ...(taxaConclusaoGeral < 70 ? [{ 
          tipo: 'Taxa de conclusão baixa', 
          descricao: `Taxa geral de ${taxaConclusaoGeral}% está abaixo do ideal (70%)`,
          prioridade: 'alta' as const
        }] : []),
        ...(pendentesCorrecao > 10 ? [{ 
          tipo: 'Muitas avaliações pendentes', 
          descricao: `${pendentesCorrecao} avaliações aguardando correção`,
          prioridade: 'media' as const
        }] : [])
      ]
    };
  } catch (error) {
    logger.error({ error, userId }, 'Error getting instructor dashboard');
    return {
      tipo_dashboard: 'instrutor',
      cursos: [],
      pendentes_correcao: 0,
      metricas: {
        taxa_conclusao_geral: 0,
        avaliacao_media_geral: 0,
        total_cursos: 0,
        total_alunos: 0
      },
      alertas: []
    };
  }
}

// R17: Dashboard Administrativo
async function getAdminDashboard() {
  try {
    // Buscar métricas gerais de todos os serviços
    const [usersData, coursesData, progressData, assessmentsData] = await Promise.all([
      fetchFromService(`${process.env.USER_SERVICE_URL || 'http://user-service:3333'}/users/v1/admin/stats`),
      fetchFromService(`${COURSE_SERVICE_URL}/courses/v1/admin/stats`),
      fetchFromService(`${PROGRESS_SERVICE_URL}/progress/v1/admin/stats`),
      fetchFromService(`${ASSESSMENT_SERVICE_URL}/assessments/v1/admin/stats`)
    ]);

    // Buscar cursos populares
    const cursosPopulares = await fetchFromService(
      `${COURSE_SERVICE_URL}/courses/v1/admin/popular?limit=10`
    );

    // Buscar engajamento por departamento
    const engajamentoDepartamento = await fetchFromService(
      `${PROGRESS_SERVICE_URL}/progress/v1/admin/engagement-by-department`
    );

    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        usuarios_ativos: usersData?.usuarios_ativos_30d || 0,
        total_usuarios: usersData?.total_usuarios || 0,
        total_cursos: coursesData?.total_cursos || 0,
        taxa_conclusao_geral: progressData?.taxa_conclusao_geral || 0,
        total_inscricoes_30d: progressData?.inscricoes_30d || 0,
        avaliacao_media_plataforma: assessmentsData?.avaliacao_media || 0
      },
      cursos_populares: (cursosPopulares?.cursos || []).map((curso: any) => ({
        codigo: curso.codigo,
        titulo: curso.titulo,
        inscricoes: curso.total_inscricoes,
        taxa_conclusao: curso.taxa_conclusao
      })),
      engajamento_departamento: engajamentoDepartamento?.departamentos || [
        { departamento: 'TI', usuarios_ativos: 45, taxa_conclusao: 85 },
        { departamento: 'RH', usuarios_ativos: 32, taxa_conclusao: 78 },
        { departamento: 'Vendas', usuarios_ativos: 67, taxa_conclusao: 72 },
        { departamento: 'Marketing', usuarios_ativos: 28, taxa_conclusao: 88 }
      ],
      alertas: [
        // Cursos com baixa avaliação
        ...(coursesData?.cursos_baixa_avaliacao || []).map((curso: any) => ({
          tipo: 'Curso com baixa avaliação',
          descricao: `Curso "${curso.titulo}" com avaliação ${curso.avaliacao_media}/5`,
          prioridade: 'alta' as const
        })),
        // Instrutores inativos
        ...(usersData?.instrutores_inativos || []).map((instrutor: any) => ({
          tipo: 'Instrutor inativo',
          descricao: `Instrutor "${instrutor.nome}" sem atividade há ${instrutor.dias_inativo} dias`,
          prioridade: 'media' as const
        })),
        // Taxa de conclusão baixa
        ...(progressData?.taxa_conclusao_geral < 70 ? [{
          tipo: 'Taxa de conclusão baixa',
          descricao: `Taxa geral de ${progressData.taxa_conclusao_geral}% está abaixo do ideal`,
          prioridade: 'alta' as const
        }] : [])
      ],
      grafico_engajamento_semanal: progressData?.engajamento_semanal || [],
      ranking_departamentos: engajamentoDepartamento?.ranking || []
    };
  } catch (error) {
    logger.error({ error }, 'Error getting admin dashboard');
    return {
      tipo_dashboard: 'administrador',
      metricas_gerais: {
        usuarios_ativos: 0,
        total_usuarios: 0,
        total_cursos: 0,
        taxa_conclusao_geral: 0
      },
      cursos_populares: [],
      engajamento_departamento: [],
      alertas: []
    };
  }
}
