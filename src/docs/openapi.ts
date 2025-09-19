export const openapiSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "User Service API",
    "version": "2.0.0",
    "description": "Serviço de usuários com departamentos, cargos e funcionários. Rotas REAIS implementadas."
  },
  "paths": {
    "/users/v1/departamentos": {
      "get": {
        "summary": "Listar departamentos (público)",
        "tags": ["departamentos"],
        "responses": {
          "200": {
            "description": "Lista de departamentos ativos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {"$ref": "#/components/schemas/Departamento"}
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
                "schema": {"$ref": "#/components/schemas/Departamento"}
              }
            }
          }
        }
      }
    },
    "/users/v1/departamentos/{codigo}": {
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
                "schema": {"$ref": "#/components/schemas/Departamento"}
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
                  "role": {"type": "string", "enum": ["FUNCIONARIO", "INSTRUTOR", "ADMIN"]}
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
        "summary": "Obter dashboard do usuário baseado na role",
        "tags": ["funcionarios"],
        "security": [{"bearerAuth": []}],
        "description": "Retorna dados do dashboard personalizados conforme a role do usuário: ALUNO, INSTRUTOR, GERENTE ou ADMIN",
        "responses": {
          "200": {
            "description": "Dados do dashboard",
            "content": {
              "application/json": {
                "schema": {
                  "oneOf": [
                    {"$ref": "#/components/schemas/DashboardAluno"},
                    {"$ref": "#/components/schemas/DashboardInstrutor"},
                    {"$ref": "#/components/schemas/DashboardGerente"},
                    {"$ref": "#/components/schemas/DashboardAdmin"}
                  ]
                }
              }
            }
          },
          "400": {
            "description": "Erro na requisição",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {"type": "string"}
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
                    "error": {"type": "string"}
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
          "auth_user_id": {"type": "string", "format": "uuid", "nullable": true},
          "cpf": {"type": "string", "nullable": true},
          "nome": {"type": "string"},
          "email": {"type": "string", "format": "email"},
          "departamento_id": {"type": "string", "nullable": true},
          "cargo_nome": {"type": "string", "nullable": true},
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
          "cargo_nome": {"type": "string", "nullable": true}
        }
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
              "total_usuarios": {"type": "integer"},
              "usuarios_ativos_30d": {"type": "integer"},
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
                "departamento": {"type": "string"},
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