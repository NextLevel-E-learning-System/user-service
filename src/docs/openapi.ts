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
        "description": "Lista apenas departamentos ativos com informações básicas (código e nome) para uso público em formulários de cadastro",
        "responses": {
          "200": {
            "description": "Lista de departamentos ativos (apenas código e nome)",
            "content": {
              "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "items": {
                          "type": "array",
                          "items": {"$ref": "#/components/schemas/DepartamentoPublico"}
                        },
                        "mensagem": {"type": "string"}
                      }
                    },
                    "example": {
                      "items": [
                        {"codigo": "TI", "nome": "Tecnologia da Informação"},
                        {"codigo": "RH", "nome": "Recursos Humanos"}
                      ],
                      "mensagem": "Departamentos listados com sucesso"
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
                "schema": {"type": "object", "properties": {"departamento": {"$ref": "#/components/schemas/DepartamentoCompleto"}, "mensagem": {"type": "string"}}},
                "example": {"departamento": {"codigo": "TI", "nome": "Tecnologia"}, "mensagem": "Departamento criado com sucesso"}
              }
            }
          },
          "400": {"description": "Dados inválidos", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "dados_invalidos", "mensagem": "Campos obrigatórios ausentes"}}}},
          "409": {"description": "Conflito (código já existente)", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "departamento_ja_existente", "mensagem": "Já existe departamento com este código"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
          }
        }
      }
    },
    "/users/v1/departamentos/admin": {
      "get": {
        "summary": "Listar todos os departamentos (ADMIN)",
        "tags": ["departamentos"],
        "security": [{"bearerAuth": []}],
        "description": "Lista todos os departamentos (ativos e inativos) com informações completas para administração. Inclui descrição, gestor, status, datas e contadores.",
        "responses": {
          "200": {
            "description": "Lista completa de departamentos com todas as informações",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "items": { "type": "array", "items": {"$ref": "#/components/schemas/DepartamentoCompleto"}},
                    "mensagem": {"type": "string"}
                  }
                },
                "example": {
                  "items": [
                    {
                      "codigo": "TI",
                      "nome": "Tecnologia da Informação", 
                      "descricao": "Responsável por sistemas e infraestrutura",
                      "gestor_funcionario_id": "123e4567-e89b-12d3-a456-426614174000",
                      "gestor_nome": "João Silva",
                      "ativo": true,
                      "total_funcionarios": 15,
                      "criado_em": "2024-01-15T10:00:00Z",
                      "atualizado_em": "2024-03-20T14:30:00Z",
                      "inactivated_at": null
                    }
                  ],
                  "mensagem": "Departamentos listados com sucesso"
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
                "schema": { "type": "object", "properties": { "departamento": {"$ref": "#/components/schemas/DepartamentoCompleto"}, "mensagem": {"type": "string"} } }
              }
            }
          },
          "404": {
            "description": "Departamento não encontrado",
            "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "departamento_nao_encontrado", "mensagem": "Departamento não encontrado"}}}
          },
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "departamento": {"$ref": "#/components/schemas/DepartamentoCompleto"}, "mensagem": {"type": "string"} } },
                "example": {"departamento": {"codigo": "TI", "nome": "Tecnologia"}, "mensagem": "Departamento atualizado com sucesso"}
              }
            }
          },
          "404": {"description": "Departamento não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "departamento_nao_encontrado", "mensagem": "Departamento não encontrado"}}}},
          "400": {"description": "Dados inválidos", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "dados_invalidos", "mensagem": "Nenhum campo para atualizar"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
          "200": {"description": "Departamento desativado", "content": {"application/json": {"schema": {"type": "object", "properties": {"mensagem": {"type": "string"}}}, "example": {"mensagem": "Departamento desativado com sucesso"}}}},
          "404": {"description": "Departamento não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "departamento_nao_encontrado", "mensagem": "Departamento não encontrado"}}}},
          "409": {"description": "Conflito - departamento com vínculos", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "examples": {"departamento_com_categorias": {"value": {"erro": "departamento_com_categorias", "mensagem": "Departamento possui categorias associadas"}}, "departamento_com_funcionarios": {"value": {"erro": "departamento_com_funcionarios", "mensagem": "Departamento possui funcionários ativos"}}}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "items": {"type": "array", "items": {"$ref": "#/components/schemas/Cargo"}}, "mensagem": {"type": "string"} } }
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
                "schema": { "type": "object", "properties": { "cargo": {"$ref": "#/components/schemas/Cargo"}, "mensagem": {"type": "string"} } },
                "example": {"cargo": {"codigo": "DEVJR", "nome": "Dev Júnior"}, "mensagem": "Cargo criado com sucesso"}
              }
            }
          },
          "409": {"description": "Conflito - cargo já existe", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "cargo_ja_existente", "mensagem": "Já existe cargo com este código"}}}},
          "400": {"description": "Dados inválidos", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "dados_invalidos", "mensagem": "Campos obrigatórios ausentes"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "cargo": {"$ref": "#/components/schemas/Cargo"}, "mensagem": {"type": "string"} } },
                "example": {"cargo": {"codigo": "DEVJR", "nome": "Dev Júnior"}, "mensagem": "Cargo atualizado com sucesso"}
              }
            }
          },
          "404": {"description": "Cargo não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "cargo_nao_encontrado", "mensagem": "Cargo não encontrado"}}}},
          "409": {"description": "Conflito - nome já existente", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "nome_ja_utilizado", "mensagem": "Já existe cargo com este nome"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
          "200": {"description": "Cargo deletado", "content": {"application/json": {"schema": {"type": "object", "properties": {"mensagem": {"type": "string"}}}, "example": {"mensagem": "Cargo deletado com sucesso"}}}},
          "404": {"description": "Cargo não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "cargo_nao_encontrado", "mensagem": "Cargo não encontrado"}}}},
          "409": {"description": "Conflito - cargo em uso", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "cargo_em_uso", "mensagem": "Existem funcionários vinculados a este cargo"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "funcionario": {"$ref": "#/components/schemas/Funcionario"}, "mensagem": {"type": "string"} } },
                "example": {"funcionario": {"id": "uuid", "nome": "João"}, "mensagem": "Funcionário criado com sucesso"}
              }
            }
          },
          "409": {"description": "Conflito - email ou cpf já cadastrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "examples": {"email_ja_cadastrado": {"value": {"erro": "email_ja_cadastrado", "mensagem": "Email já está cadastrado no sistema"}}, "cpf_ja_cadastrado": {"value": {"erro": "cpf_ja_cadastrado", "mensagem": "CPF já está cadastrado no sistema"}}}}}},
          "400": {"description": "Dados inválidos", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "dados_invalidos", "mensagem": "Nome e email são obrigatórios"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "items": {"type": "array", "items": {"$ref": "#/components/schemas/Funcionario"}}, "mensagem": {"type": "string"} } },
                "example": {"items": [{"id": "uuid", "nome": "João"}], "mensagem": "Funcionários listados com sucesso"}
              }
            }
          },
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
                "schema": { "type": "object", "properties": { "funcionario": {"$ref": "#/components/schemas/Funcionario"}, "mensagem": {"type": "string"}, "granted_by": {"type": "string", "format": "uuid"} } },
                "example": {"funcionario": {"id": "uuid", "role": "INSTRUTOR"}, "granted_by": "uuid-admin", "mensagem": "Role atualizada para INSTRUTOR"}
              }
            }
          },
          "404": {"description": "Funcionário não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "funcionario_nao_encontrado", "mensagem": "Funcionário não encontrado"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
        }
      }
    },
    "/users/v1/funcionarios/dashboard": {
      "get": {
        "summary": "Obter dashboard completo do usuário",
        "tags": ["funcionarios"],
        "security": [{"bearerAuth": []}],
        "description": "Retorna dados completos do usuário e dashboard personalizado conforme a role:\n\n• **ALUNO**: Progressão XP/nível, cursos em andamento/concluídos, ranking departamental e geral\n• **INSTRUTOR**: Métricas dos cursos, alunos inscritos/concluídos, avaliações pendentes\n• **GERENTE**: Dados do departamento específico (mesmo formato ADMIN mas filtrado), métricas departamentais\n• **ADMIN**: Visão completa da plataforma, métricas gerais, engajamento por departamento, cursos populares\n\n**Integração com Microserviços:**\nO dashboard integra dados de múltiplos serviços:\n- `course-service`: Informações de cursos e categorias\n- `progress-service`: Progresso de aprendizagem e conclusões  \n- `gamification-service`: XP, badges e rankings\n- `assessment-service`: Avaliações e notas\n\n**Notificações:**\nAlertas e notificações são gerenciados pelo `notification-service` via RabbitMQ.\n\n**Autenticação:**\nRequer header `x-user-data` (base64 JSON) ou fallback `x-user-id` fornecido pelo API Gateway.",
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
                    "departamento": "Tecnologia da Informação",
                    "cargo": "Desenvolvedor",
                    "nivel": "Intermediário",
                    "xp_total": 1250,
                    "roles": ["ALUNO"]
                  },
                  "dashboard": {
                    "tipo_dashboard": "aluno",
                    "progressao": {
                      "xp_atual": 1250,
                      "nivel_atual": 2,
                      "xp_proximo_nivel": 2000,
                      "progresso_nivel": 63,
                      "badges_conquistados": [
                        {"tipo": "primeiro_curso", "nome": "Primeiro Passo", "conquistado_em": "2024-01-15"}
                      ]
                    },
                    "cursos": {
                      "em_andamento": [
                        {"codigo": "JS101", "titulo": "JavaScript Básico", "progresso": 45}
                      ],
                      "concluidos": [
                        {"codigo": "HTML101", "titulo": "HTML Fundamentals", "concluido_em": "2024-01-10"}
                      ]
                    },
                    "ranking": {
                      "posicao_departamento": 5,
                      "total_departamento": 20,
                      "posicao_geral": 45
                    }
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
                    "erro": {"type": "string", "example": "user_not_authenticated"},
                    "mensagem": {"type": "string", "example": "Usuário não autenticado"}
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
                    "erro": {"type": "string", "example": "user_not_found"},
                    "mensagem": {"type": "string", "example": "Usuário não encontrado"}
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
                    "erro": {"type": "string", "example": "internal_server_error"},
                    "mensagem": {"type": "string", "example": "Erro interno ao gerar dashboard"}
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
            "description": "Reset processado",
            "content": {
              "application/json": {
                "schema": {"type": "object", "properties": {"mensagem": {"type": "string"}}},
                "example": {"mensagem": "Senha redefinida e evento enviado."}
              }
            }
          },
          "400": {"description": "Email obrigatório", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "email_obrigatorio", "mensagem": "Email é obrigatório"}}}},
          "404": {"description": "Usuário não encontrado", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "usuario_nao_encontrado", "mensagem": "Usuário não encontrado"}}}},
          "500": {"description": "Erro interno", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/ErrorResponse"}, "example": {"erro": "erro_interno", "mensagem": "Erro interno do servidor"}}}}
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
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "erro": {"type": "string"},
          "mensagem": {"type": "string"}
        },
        "required": ["erro", "mensagem"],
        "description": "Formato padrão para respostas de erro"
      },
      "DepartamentoPublico": {
        "type": "object",
        "description": "Versão pública simplificada do departamento - apenas informações básicas para uso em formulários de cadastro",
        "required": ["codigo", "nome"],
        "properties": {
          "codigo": {
            "type": "string",
            "description": "Código único do departamento",
            "example": "TI"
          },
          "nome": {
            "type": "string", 
            "description": "Nome completo do departamento",
            "example": "Tecnologia da Informação"
          }
        }
      },
      "DepartamentoCompleto": {
        "type": "object",
        "description": "Versão completa do departamento com todas as informações para administração",
        "required": ["codigo", "nome", "ativo", "criado_em", "atualizado_em"],
        "properties": {
          "codigo": {
            "type": "string",
            "description": "Código único do departamento"
          },
          "nome": {
            "type": "string",
            "description": "Nome completo do departamento"
          },
          "descricao": {
            "type": "string", 
            "nullable": true,
            "description": "Descrição detalhada do departamento"
          },
          "gestor_funcionario_id": {
            "type": "string", 
            "format": "uuid", 
            "nullable": true,
            "description": "ID do funcionário que gerencia este departamento"
          },
          "gestor_nome": {
            "type": "string", 
            "nullable": true, 
            "description": "Nome do funcionário gestor"
          },
          "gestor_email": {
            "type": "string",
            "format": "email",
            "nullable": true,
            "description": "Email do funcionário gestor"
          },
          "ativo": {
            "type": "boolean",
            "description": "Indica se o departamento está ativo"
          },
          "total_funcionarios": {
            "type": "integer",
            "description": "Número total de funcionários ativos neste departamento",
            "minimum": 0
          },
          "inactivated_at": {
            "type": "string", 
            "format": "date-time", 
            "nullable": true,
            "description": "Data e hora da inativação (se aplicável)"
          },
          "criado_em": {
            "type": "string", 
            "format": "date-time",
            "description": "Data e hora da criação"
          },
          "atualizado_em": {
            "type": "string", 
            "format": "date-time",
            "description": "Data e hora da última atualização"
          }
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
        "description": "Dashboard específico para usuários com role ALUNO",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["aluno"]},
          "progressao": {
            "type": "object",
            "description": "Informações sobre progressão de XP e nível",
            "properties": {
              "xp_atual": {"type": "integer", "description": "XP atual do aluno"},
              "nivel_atual": {"type": "integer", "description": "Nível atual baseado no XP"},
              "xp_proximo_nivel": {"type": "integer", "description": "XP necessário para o próximo nível"},
              "progresso_nivel": {"type": "integer", "description": "Percentual de progresso para o próximo nível"},
              "badges_conquistados": {
                "type": "array", 
                "items": {"type": "object"},
                "description": "Lista de badges/conquistas do aluno"
              }
            },
            "required": ["xp_atual", "nivel_atual", "xp_proximo_nivel", "progresso_nivel", "badges_conquistados"]
          },
          "cursos": {
            "type": "object",
            "description": "Informações sobre cursos do aluno",
            "properties": {
              "em_andamento": {
                "type": "array", 
                "items": {"type": "object"},
                "description": "Cursos atualmente em progresso"
              },
              "concluidos": {
                "type": "array", 
                "items": {"type": "object"},
                "description": "Cursos já concluídos"
              }
            },
            "required": ["em_andamento", "concluidos"]
          },
          "ranking": {
            "type": "object",
            "description": "Posição do aluno nos rankings",
            "properties": {
              "posicao_departamento": {
                "type": "integer", 
                "nullable": true,
                "description": "Posição no ranking do departamento"
              },
              "total_departamento": {
                "type": "integer", 
                "nullable": true,
                "description": "Total de participantes no ranking do departamento"
              },
              "posicao_geral": {
                "type": "integer", 
                "nullable": true,
                "description": "Posição no ranking geral da empresa"
              }
            }
          }
        },
        "required": ["tipo_dashboard", "progressao", "cursos", "ranking"]
      },
      "DashboardInstrutor": {
        "type": "object",
        "description": "Dashboard específico para usuários com role INSTRUTOR",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["instrutor"]},
          "metricas": {
            "type": "object",
            "description": "Métricas gerais do instrutor",
            "properties": {
              "total_cursos": {"type": "integer", "description": "Total de cursos do instrutor"},
              "total_alunos": {"type": "integer", "description": "Total de alunos inscritos nos cursos"},
              "taxa_conclusao_geral": {"type": "number", "description": "Taxa média de conclusão dos cursos"},
              "avaliacao_media_geral": {"type": "number", "description": "Avaliação média de todos os cursos"},
              "pendentes_correcao": {"type": "integer", "description": "Número de avaliações pendentes de correção"}
            },
            "required": ["total_cursos", "total_alunos", "taxa_conclusao_geral", "avaliacao_media_geral", "pendentes_correcao"]
          },
          "cursos": {
            "type": "array",
            "description": "Lista detalhada dos cursos do instrutor",
            "items": {
              "type": "object",
              "properties": {
                "codigo": {"type": "string", "description": "Código do curso"},
                "titulo": {"type": "string", "description": "Título do curso"},
                "inscritos": {"type": "integer", "description": "Número de alunos inscritos"},
                "concluidos": {"type": "integer", "description": "Número de alunos que concluíram"},
                "taxa_conclusao": {"type": "number", "description": "Taxa de conclusão em percentual"},
                "avaliacao_media": {"type": "number", "nullable": true, "description": "Avaliação média do curso"},
                "status": {"type": "string", "description": "Status do curso (Ativo/Inativo)"}
              },
              "required": ["codigo", "titulo", "inscritos", "concluidos", "taxa_conclusao", "status"]
            }
          }
        },
        "required": ["tipo_dashboard", "metricas", "cursos"]
      },
      "DashboardGerente": {
        "type": "object",
        "description": "Dashboard específico para usuários com role GERENTE - na prática retorna a mesma estrutura que DashboardAdmin mas filtrado por departamento",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["administrador"], "description": "Retorna 'administrador' para compatibilidade com o frontend"},
          "metricas_gerais": {
            "type": "object",
            "description": "Métricas gerais do departamento do gerente",
            "properties": {
              "total_funcionarios": {"type": "integer", "description": "Total de funcionários no departamento"},
              "funcionarios_ativos": {"type": "integer", "description": "Funcionários ativos no departamento"},
              "alunos_ativos": {"type": "integer", "description": "Alunos ativos no departamento"},
              "total_instrutores": {"type": "integer", "description": "Total de instrutores no departamento"},
              "total_cursos": {"type": "integer", "description": "Total de cursos relacionados ao departamento"},
              "taxa_conclusao_geral": {"type": "number", "description": "Taxa média de conclusão no departamento"},
              "inscricoes_30d": {"type": "integer", "description": "Novas inscrições nos últimos 30 dias"},
              "avaliacao_media_plataforma": {"type": "number", "description": "Avaliação média dos cursos no departamento"}
            },
            "required": ["total_funcionarios", "funcionarios_ativos", "alunos_ativos", "total_instrutores", "total_cursos", "taxa_conclusao_geral", "inscricoes_30d", "avaliacao_media_plataforma"]
          },
          "engajamento_departamentos": {
            "type": "array",
            "description": "Dados de engajamento (contém apenas o departamento do gerente)",
            "items": {
              "type": "object",
              "properties": {
                "codigo": {"type": "string", "description": "Código do departamento"},
                "nome": {"type": "string", "description": "Nome do departamento"},
                "total_funcionarios": {"type": "integer", "description": "Total de funcionários"},
                "xp_medio": {"type": "integer", "description": "XP médio dos funcionários"},
                "funcionarios_ativos": {"type": "integer", "description": "Funcionários ativos"}
              },
              "required": ["codigo", "nome", "total_funcionarios", "xp_medio", "funcionarios_ativos"]
            }
          },
          "cursos_populares": {
            "type": "array", 
            "description": "Lista de cursos populares do departamento",
            "items": {"type": "object"}
          },
          "_departamento_restrito": {
            "type": "object",
            "description": "Informação adicional indicando restrição departamental",
            "properties": {
              "departamento_id": {"type": "string", "description": "ID do departamento do gerente"},
              "departamento_nome": {"type": "string", "description": "Nome do departamento do gerente"}
            },
            "required": ["departamento_id", "departamento_nome"]
          }
        },
        "required": ["tipo_dashboard", "metricas_gerais", "engajamento_departamentos", "cursos_populares", "_departamento_restrito"]
      },
      "DashboardAdmin": {
        "type": "object",
        "description": "Dashboard específico para usuários com role ADMIN",
        "properties": {
          "tipo_dashboard": {"type": "string", "enum": ["administrador"]},
          "metricas_gerais": {
            "type": "object",
            "description": "Métricas gerais de toda a plataforma",
            "properties": {
              "total_funcionarios": {"type": "integer", "description": "Total de funcionários na empresa"},
              "funcionarios_ativos": {"type": "integer", "description": "Funcionários ativos na empresa"},
              "alunos_ativos": {"type": "integer", "description": "Alunos ativos na plataforma"},
              "total_instrutores": {"type": "integer", "description": "Total de instrutores"},
              "total_cursos": {"type": "integer", "description": "Total de cursos na plataforma"},
              "taxa_conclusao_geral": {"type": "number", "description": "Taxa média de conclusão geral"},
              "inscricoes_30d": {"type": "integer", "description": "Novas inscrições nos últimos 30 dias"},
              "avaliacao_media_plataforma": {"type": "number", "description": "Avaliação média de todos os cursos"}
            },
            "required": ["total_funcionarios", "funcionarios_ativos", "alunos_ativos", "total_instrutores", "total_cursos", "taxa_conclusao_geral", "inscricoes_30d", "avaliacao_media_plataforma"]
          },
          "engajamento_departamentos": {
            "type": "array",
            "description": "Dados de engajamento de todos os departamentos",
            "items": {
              "type": "object",
              "properties": {
                "codigo": {"type": "string", "description": "Código do departamento"},
                "nome": {"type": "string", "description": "Nome do departamento"},
                "total_funcionarios": {"type": "integer", "description": "Total de funcionários no departamento"},
                "xp_medio": {"type": "integer", "description": "XP médio dos funcionários do departamento"},
                "funcionarios_ativos": {"type": "integer", "description": "Funcionários ativos no departamento"}
              },
              "required": ["codigo", "nome", "total_funcionarios", "xp_medio", "funcionarios_ativos"]
            }
          },
          "cursos_populares": {
            "type": "array", 
            "description": "Lista dos cursos mais populares da plataforma",
            "items": {
              "type": "object",
              "description": "Dados de curso popular",
              "properties": {
                "codigo": {"type": "string", "description": "Código do curso"},
                "titulo": {"type": "string", "description": "Título do curso"},
                "total_inscricoes": {"type": "integer", "description": "Total de inscrições"},
                "taxa_conclusao": {"type": "number", "description": "Taxa de conclusão em decimal (0-1)"}
              }
            }
          }
        },
        "required": ["tipo_dashboard", "metricas_gerais", "engajamento_departamentos", "cursos_populares"]
      }
    }
  }
};