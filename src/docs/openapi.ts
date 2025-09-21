export const openapiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "User Service API",
    "version": "2.1.0",
    "description": "Serviço de usuários com departamentos, cargos e funcionários. Endpoint /funcionarios/dashboard retorna dados completos do usuário e dashboard em uma única resposta."
  },
  "paths": {
    "/users/v1/departamentos": {
      "get": {
        "summary": "Listar departamentos (público)",
        "tags": ["departamentos"],
        "description": "Lista apenas departamentos ativos para uso público",
        "responses": {
          "200": {
            "description": "Lista de departamentos ativos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/DepartamentoPublico"}
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Criar departamento (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/DepartamentoCreate"}
            }
          }
        },
        "responses": {
          "201": {
            "description": "Departamento criado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/DepartamentoCompleto"}
              }
            }
          }
        }
      }
    },
    "/users/v1/departamentos/admin": {
      "get": {
        "summary": "Listar todos os departamentos (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "description": "Lista todos os departamentos (ativos e inativos) com informações completas para administração",
        "responses": {
          "200": {
            "description": "Lista completa de departamentos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/DepartamentoCompleto"}
                }
              }
            }
          }
        }
      }
    },
    "/users/v1/departamentos/{codigo}": {
      "get": {
        "summary": "Obter departamento específico (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "responses": {
          "200": {
            "description": "Dados completos do departamento",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/DepartamentoCompleto"}
              }
            }
          },
          "404": {
            "description": "Departamento não encontrado"
          }
        }
      },
      "put": {
        "summary": "Atualizar departamento (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/DepartamentoUpdate"}
            }
          }
        },
        "responses": {
          "200": {
            "description": "Departamento atualizado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/DepartamentoCompleto"}
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Desativar departamento (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "responses": {
          "204": {"description": "Departamento desativado"}
        }
      }
    },
    "/users/v1/cargos": {
      "get": {
        "summary": "Listar cargos (público)",
        "tags": ["cargos"],
        "responses": {
          "200": {
            "description": "Lista de cargos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/Cargo"}
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Criar cargo (ADMIN)",
        "tags": ["cargos"],
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/CargoCreate"}
            }
          }
        },
        "responses": {
          "201": {
            "description": "Cargo criado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Cargo"}
              }
            }
          }
        }
      }
    },
    "/users/v1/cargos/{codigo}": {
      "put": {
        "summary": "Atualizar cargo (ADMIN)",
        "tags": ["cargos"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/CargoUpdate"}
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cargo atualizado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Cargo"}
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Deletar cargo (ADMIN)",
        "tags": ["cargos"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "codigo", "in": "path", "required": true, "schema": {"type": "string"}}
        ],
        "responses": {
          "204": {"description": "Cargo deletado"}
        }
      }
    },
    "/users/v1/register": {
      "post": {
        "summary": "Auto-cadastro de funcionário (público)",
        "tags": ["funcionarios"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {"$ref": "#/components/schemas/FuncionarioRegister"}
            }
          }
        },
        "responses": {
          "201": {
            "description": "Funcionário registrado",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Funcionario"}
              }
            }
          }
        }
      }
    },
    "/users/v1/funcionarios": {
      "get": {
        "summary": "Listar funcionários (ADMIN)",
        "tags": ["funcionarios"],
        "security": [{"bearerAuth": []}],
        "responses": {
          "200": {
            "description": "Lista de funcionários",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/Funcionario"}
                }
              }
            }
          }
        }
      }
    },
    "/users/v1/funcionarios/{id}/role": {
      "put": {
        "summary": "Atualizar role do funcionário (ADMIN)",
        "tags": ["funcionarios"],
        "security": [{"bearerAuth": []}],
        "parameters": [
          {"name": "id", "in": "path", "required": true, "schema": {"type": "string", "format": "uuid"}}
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["role"],
                "properties": {
                  "role": {
                    "type": "string", 
                    "enum": ["ADMIN", "INSTRUTOR", "GERENTE", "ALUNO"],
                    "description": "Nova role do funcionário"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Role atualizada",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/Funcionario"}
              }
            }
          }
        }
      }
    },
    "/users/v1/funcionarios/dashboard": {
      "get": {
        "summary": "Obter dashboard completo do usuário",
        "tags": ["funcionarios"],
        "security": [{"bearerAuth": []}],
        "description": "Retorna dados completos do usuário e dashboard personalizado conforme a role: ALUNO, INSTRUTOR, GERENTE ou ADMIN",
        "responses": {
          "200": {
            "description": "Dados completos do dashboard e usuário",
            "content": {
              "application/json": {
                "schema": {"$ref": "#/components/schemas/DashboardResponse"},
                "example": {
                  "usuario": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "nome": "João Silva",
                    "email": "joao.silva@empresa.com",
                    "departamento": "Tecnologia",
                    "cargo": "Desenvolvedor",
                    "nivel": "Intermediário",
                    "xp_total": 1250,
                    "roles": ["ALUNO"]
                  },
                  "dashboard": {
                    "tipo_dashboard": "aluno",
                    "progressao": {
                      "xp_atual": 1250,
                      "nivel_atual": 3,
                      "xp_proximo_nivel": 2000,
                      "progresso_nivel": 62.5,
                      "badges_conquistados": []
                    },
                    "cursos": {
                      "em_andamento": [],
                      "concluidos": [],
                      "recomendados": [],
                      "populares": []
                    },
                    "ranking": {
                      "posicao_departamento": 5,
                      "total_departamento": 20,
                      "posicao_geral": 45
                    },
                    "atividades_recentes": []
                  }
                }
              }
            }
          },
          "401": {
            "description": "Usuário não autenticado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {"type": "string", "example": "user_not_authenticated"}
                  }
                }
              }
            }
          },
          "404": {
            "description": "Usuário não encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {"type": "string", "example": "user_not_found"}
                  }
                }
              }
            }
          },
          "500": {
            "description": "Erro interno do servidor",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {"type": "string", "example": "internal_server_error"}
                  }
                }
              }
            }
          }
        }
      }
    },
    "/users/v1/reset-password": {
      "post": {
        "summary": "Solicitar reset de senha (público)",
        "tags": ["funcionarios"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email"],
                "properties": {
                  "email": {"type": "string", "format": "email"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Email de reset enviado",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "sucesso": {"type": "boolean"}
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "DepartamentoPublico": {
        "type": "object",
        "description": "Versão pública simplificada do departamento",
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"}
        }
      },
      "DepartamentoCompleto": {
        "type": "object",
        "description": "Versão completa do departamento com todas as informações",
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"},
          "descricao": {"type": "string", "nullable": true},
          "gestor_funcionario_id": {"type": "string", "format": "uuid", "nullable": true},
          "gestor_nome": {"type": "string", "nullable": true, "description": "Nome do funcionário gestor"},
          "ativo": {"type": "boolean"},
          "inactivated_at": {"type": "string", "format": "date-time", "nullable": true},
          "criado_em": {"type": "string", "format": "date-time"},
          "atualizado_em": {"type": "string", "format": "date-time"}
        }
      },
      "Departamento": {
        "type": "object",
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"},
          "descricao": {"type": "string", "nullable": true},
          "gestor_funcionario_id": {"type": "string", "format": "uuid", "nullable": true},
          "ativo": {"type": "boolean"}
        }
      },
      "DepartamentoCreate": {
        "type": "object",
        "required": ["codigo", "nome"],
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"},
          "descricao": {"type": "string", "nullable": true},
          "gestor_funcionario_id": {"type": "string", "format": "uuid", "nullable": true}
        }
      },
      "DepartamentoUpdate": {
        "type": "object",
        "properties": {
          "nome": {"type": "string"},
          "descricao": {"type": "string", "nullable": true},
          "gestor_funcionario_id": {"type": "string", "format": "uuid", "nullable": true}
        }
      },
      "Cargo": {
        "type": "object",
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"},
          "criado_em": {"type": "string", "format": "date-time"},
          "atualizado_em": {"type": "string", "format": "date-time"}
        }
      },
      "CargoCreate": {
        "type": "object",
        "required": ["codigo", "nome"],
        "properties": {
          "codigo": {"type": "string"},
          "nome": {"type": "string"}
        }
      },
      "CargoUpdate": {
        "type": "object",
        "properties": {
          "nome": {"type": "string"}
        }
      },
      "Funcionario": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "cpf": {"type": "string", "nullable": true},
          "nome": {"type": "string"},
          "email": {"type": "string", "format": "email"},
          "departamento_id": {"type": "string", "nullable": true},
          "cargo_nome": {"type": "string", "nullable": true},
          "role": {
            "type": "string", 
            "enum": ["ADMIN", "INSTRUTOR", "GERENTE", "ALUNO"],
            "default": "ALUNO",
            "description": "Role/função do funcionário no sistema"
          },
          "xp_total": {"type": "integer", "default": 0},
          "nivel": {"type": "string", "default": "Iniciante"},
          "ativo": {"type": "boolean", "default": true},
          "inactivated_at": {"type": "string", "format": "date-time", "nullable": true},
          "criado_em": {"type": "string", "format": "date-time"},
          "atualizado_em": {"type": "string", "format": "date-time"}
        }
      },
      "FuncionarioRegister": {
        "type": "object",
        "required": ["nome", "email"],
        "properties": {
          "cpf": {"type": "string", "nullable": true},
          "nome": {"type": "string"},
          "email": {"type": "string", "format": "email"},
          "departamento_id": {"type": "string", "nullable": true},
          "cargo_nome": {"type": "string", "nullable": true},
          "role": {
            "type": "string", 
            "enum": ["ADMIN", "INSTRUTOR", "GERENTE", "ALUNO"],
            "default": "ALUNO",
            "description": "Role/função do funcionário no sistema"
          }
        }
      },
      "DashboardResponse": {
        "type": "object",
        "description": "Resposta completa do endpoint dashboard incluindo dados do usuário e dashboard específico da role",
        "properties": {
          "usuario": {
            "type": "object",
            "description": "Informações básicas do usuário autenticado",
            "properties": {
              "id": {"type": "string", "format": "uuid"},
              "nome": {"type": "string"},
              "email": {"type": "string", "format": "email"},
              "departamento": {"type": "string", "nullable": true, "description": "Nome do departamento"},
              "cargo": {"type": "string", "nullable": true, "description": "Nome do cargo"},
              "nivel": {"type": "string", "description": "Nível atual do usuário"},
              "xp_total": {"type": "integer", "description": "Total de XP acumulado"},
              "roles": {
                "type": "array",
                "items": {"type": "string", "enum": ["ALUNO", "INSTRUTOR", "GERENTE", "ADMIN"]},
                "description": "Roles do usuário no sistema"
              }
            },
            "required": ["id", "nome", "email", "nivel", "xp_total", "roles"]
          },
          "dashboard": {
            "oneOf": [
              {"$ref": "#/components/schemas/DashboardAluno"},
              {"$ref": "#/components/schemas/DashboardInstrutor"},
              {"$ref": "#/components/schemas/DashboardGerente"},
              {"$ref": "#/components/schemas/DashboardAdmin"}
            ],
            "description": "Dados específicos do dashboard baseado na role do usuário"
          }
        },
        "required": ["usuario", "dashboard"]
      },
      "DashboardAluno": {
        "type": "object",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["aluno"]},
          "progressao": {
            "type": "object",
            "properties": {
              "xp_atual": {"type": "integer"},
              "nivel_atual": {"type": "integer"},
              "xp_proximo_nivel": {"type": "integer"},
              "progresso_nivel": {"type": "integer"},
              "badges_conquistados": {"type": "array", "items": {"type": "object"}}
            }
          },
          "cursos": {
            "type": "object",
            "properties": {
              "em_andamento": {"type": "array", "items": {"type": "object"}},
              "concluidos": {"type": "array", "items": {"type": "object"}},
              "recomendados": {"type": "array", "items": {"type": "object"}},
              "populares": {"type": "array", "items": {"type": "object"}}
            }
          },
          "ranking": {
            "type": "object",
            "properties": {
              "posicao_departamento": {"type": "integer", "nullable": true},
              "total_departamento": {"type": "integer", "nullable": true},
              "posicao_geral": {"type": "integer", "nullable": true}
            }
          },
          "atividades_recentes": {"type": "array", "items": {"type": "object"}}
        }
      },
      "DashboardInstrutor": {
        "type": "object",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["instrutor"]},
          "metricas": {
            "type": "object",
            "properties": {
              "total_cursos": {"type": "integer"},
              "total_alunos": {"type": "integer"},
              "taxa_conclusao_geral": {"type": "number"},
              "avaliacao_media_geral": {"type": "number"},
              "pendentes_correcao": {"type": "integer"}
            }
          },
          "cursos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "codigo": {"type": "string"},
                "titulo": {"type": "string"},
                "inscritos": {"type": "integer"},
                "concluidos": {"type": "integer"},
                "taxa_conclusao": {"type": "number"},
                "avaliacao_media": {"type": "number", "nullable": true},
                "status": {"type": "string"}
              }
            }
          },
          "alertas": {"type": "array", "items": {"type": "object"}},
          "atividades_recentes": {"type": "array", "items": {"type": "object"}}
        }
      },
      "DashboardGerente": {
        "type": "object",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["gerente"]},
          "departamento": {
            "type": "object",
            "properties": {
              "nome": {"type": "string"},
              "total_funcionarios": {"type": "integer"},
              "funcionarios_ativos": {"type": "integer"},
              "taxa_conclusao_cursos": {"type": "number"},
              "xp_medio_funcionarios": {"type": "number"}
            }
          },
          "top_performers": {"type": "array", "items": {"type": "object"}},
          "cursos_departamento": {"type": "array", "items": {"type": "object"}},
          "alertas": {"type": "array", "items": {"type": "object"}}
        }
      },
      "DashboardAdmin": {
        "type": "object",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["administrador"]},
          "metricas_gerais": {
            "type": "object",
            "properties": {
              "total_funcionarios": {"type": "integer"},
              "funcionarios_ativos": {"type": "integer"},
              "alunos_ativos": {"type": "integer"},
              "total_instrutores": {"type": "integer"},
              "total_cursos": {"type": "integer"},
              "taxa_conclusao_geral": {"type": "number"},
              "inscricoes_30d": {"type": "integer"},
              "avaliacao_media_plataforma": {"type": "number"}
            }
          },
          "engajamento_departamentos": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "codigo": {"type": "string"},
                "nome": {"type": "string"},
                "total_funcionarios": {"type": "integer"},
                "xp_medio": {"type": "integer"},
                "funcionarios_ativos": {"type": "integer"}
              }
            }
          },
          "cursos_populares": {"type": "array", "items": {"type": "object"}},
          "alertas": {"type": "array", "items": {"type": "object"}}
        }
      }
    }
  }
} as const;