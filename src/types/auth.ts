// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  tipo_usuario: string;
  nome?: string;
}

// Extensão do Express Request
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export interface Curso {
  codigo: string;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  status_descricao: string;
}

export interface DadosAtualizacao {
  cpf?: string;
  nome?: string;
  email?: string;
  departamento_id?: string;
  cargo?: string;
  status?: string;
}
