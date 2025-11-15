// OpenAPI 3.0 spec simplificada e válida para o user-service reconstruída após corrupção
export const openapiSpec = {
  openapi: '3.0.3',
  info: { 
    title: 'User Service API', 
    version: '2.1.0', 
    description: 'Serviço de usuários: departamentos, cargos, funcionários e dashboard.' 
  },
  tags: [
    {
      name: 'User - Departamentos',
      description: 'Gestão de Departamentos - CRUD e consultas'
    },
    {
      name: 'User - Cargos',
      description: 'Gestão de Cargos - CRUD e consultas'
    },
    {
      name: 'User - Funcionários',
      description: 'Gestão de Funcionários - CRUD, cadastro e dashboard'
    }
  ],
  paths: {
    '/users/v1/departamentos': { get: { summary: 'Listar departamentos (público)', tags: ['User - Departamentos'], responses: { '200': { description: 'Lista', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/DepartamentoPublico' } }, mensagem: { type: 'string' } } } } } } } },
      post: { summary: 'Criar departamento (ADMIN)', tags: ['User - Departamentos'], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DepartamentoCreate' } } } }, responses: { '201': { description: 'Criado', content: { 'application/json': { schema: { type: 'object', properties: { departamento: { $ref: '#/components/schemas/DepartamentoCompleto' }, mensagem: { type: 'string' } } } } } }, '409': { description: 'Conflito', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } } } },
    '/users/v1/cargos': { get: { summary: 'Listar cargos (público)', tags: ['User - Cargos'], responses: { '200': { description: 'Lista', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Cargo' } }, mensagem: { type: 'string' } } } } } } } } },
    '/users/v1/funcionarios': { get: { summary: 'Listar funcionários (ADMIN)', tags: ['User - Funcion�rios'], security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Funcionario' } }, mensagem: { type: 'string' } } } } } } } } },
    '/users/v1/funcionarios/dashboard': { get: { summary: 'Dashboard do usuário', tags: ['User - Funcion�rios'], security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardResponse' } } } } } } },
    '/users/v1/register': { post: { summary: 'Auto-cadastro (público)', tags: ['User - Funcion�rios'], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/FuncionarioRegister' } } } }, responses: { '201': { description: 'Criado', content: { 'application/json': { schema: { type: 'object', properties: { funcionario: { $ref: '#/components/schemas/Funcionario' }, mensagem: { type: 'string' } } } } } }, '409': { description: 'Conflito', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } } } },
    '/users/v1/reset-password': { post: { summary: 'Reset de senha (público)', tags: ['User - Funcion�rios'], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { '200': { description: 'Processado', content: { 'application/json': { schema: { type: 'object', properties: { mensagem: { type: 'string' } } } } } } } } }
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      ErrorResponse: { type: 'object', properties: { erro: { type: 'string' }, mensagem: { type: 'string' } }, required: ['erro', 'mensagem'] },
      DepartamentoPublico: { type: 'object', required: ['codigo', 'nome'], properties: { codigo: { type: 'string' }, nome: { type: 'string' } } },
      DepartamentoCompleto: { type: 'object', properties: { codigo: { type: 'string' }, nome: { type: 'string' }, ativo: { type: 'boolean' } }, required: ['codigo', 'nome', 'ativo'] },
      DepartamentoCreate: { type: 'object', required: ['codigo', 'nome'], properties: { codigo: { type: 'string' }, nome: { type: 'string' } } },
      DepartamentoUpdate: { type: 'object', properties: { nome: { type: 'string' } } },
  Cargo: { type: 'object', properties: { codigo: { type: 'string' }, nome: { type: 'string' } }, required: ['codigo', 'nome'] },
      Funcionario: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, nome: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['ADMIN', 'INSTRUTOR', 'GERENTE', 'FUNCIONARIO'] } }, required: ['id', 'nome', 'email', 'role'] },
      FuncionarioRegister: { type: 'object', required: ['nome', 'email'], properties: { nome: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['ADMIN', 'INSTRUTOR', 'GERENTE', 'FUNCIONARIO'], default: 'FUNCIONARIO' } } },
      DashboardResponse: { type: 'object', properties: { usuario: { type: 'object' }, dashboard: { type: 'object' } } }
    }
  }
} as const;
