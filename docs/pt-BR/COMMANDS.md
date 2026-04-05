# Referência de Comandos do GSDT

Este documento descreve os comandos principais do GSDT em Português.  
Para detalhes completos de flags avançadas e mudanças recentes, consulte também a [versão em inglês](../COMMANDS.md).

---

## Fluxo Principal

| Comando | Finalidade | Quando usar |
|---------|------------|-------------|
| `/gsdt:new-project` | Inicialização completa: perguntas, pesquisa, requisitos e roadmap | Início de projeto |
| `/gsdt:discuss-phase [N]` | Captura decisões de implementação | Antes do planejamento |
| `/gsdt:ui-phase [N]` | Gera contrato de UI (`UI-SPEC.md`) | Fases com frontend |
| `/gsdt:plan-phase [N]` | Pesquisa + planejamento + verificação | Antes de executar uma fase |
| `/gsdt:execute-phase <N>` | Executa planos em ondas paralelas | Após planejamento aprovado |
| `/gsdt:verify-work [N]` | UAT manual com diagnóstico automático | Após execução |
| `/gsdt:ship [N]` | Cria PR da fase validada | Ao concluir a fase |
| `/gsdt:next` | Detecta e executa o próximo passo lógico | Qualquer momento |
| `/gsdt:fast <texto>` | Tarefa curta sem planejamento completo | Ajustes triviais |

## Navegação e Sessão

| Comando | Finalidade |
|---------|------------|
| `/gsdt:progress` | Mostra status atual e próximos passos |
| `/gsdt:resume-work` | Retoma contexto da sessão anterior |
| `/gsdt:pause-work` | Salva handoff estruturado |
| `/gsdt:session-report` | Gera resumo da sessão |
| `/gsdt:help` | Lista comandos e uso |
| `/gsdt:update` | Atualiza o GSDT |

## Gestão de Fases

| Comando | Finalidade |
|---------|------------|
| `/gsdt:add-phase` | Adiciona fase no roadmap |
| `/gsdt:insert-phase [N]` | Insere trabalho urgente entre fases |
| `/gsdt:remove-phase [N]` | Remove fase futura e reenumera |
| `/gsdt:list-phase-assumptions [N]` | Mostra abordagem assumida pelo Claude |
| `/gsdt:plan-milestone-gaps` | Cria fases para fechar lacunas de auditoria |

## Brownfield e Utilidades

| Comando | Finalidade |
|---------|------------|
| `/gsdt:map-codebase` | Mapeia base existente antes de novo projeto |
| `/gsdt:quick` | Tarefas ad-hoc com garantias do GSDT |
| `/gsdt:debug [desc]` | Debug sistemático com estado persistente |
| `/gsdt:forensics` | Diagnóstico de falhas no workflow |
| `/gsdt:settings` | Configuração de agentes, perfil e toggles |
| `/gsdt:set-profile <perfil>` | Troca rápida de perfil de modelo |

## Qualidade de Código

| Comando | Finalidade |
|---------|------------|
| `/gsdt:review` | Peer review com múltiplas IAs |
| `/gsdt:pr-branch` | Cria branch limpa sem commits de planejamento |
| `/gsdt:audit-uat` | Audita dívida de validação/UAT |

## Backlog e Threads

| Comando | Finalidade |
|---------|------------|
| `/gsdt:add-backlog <desc>` | Adiciona item no backlog (999.x) |
| `/gsdt:review-backlog` | Promove, mantém ou remove itens |
| `/gsdt:plant-seed <ideia>` | Registra ideia com gatilho futuro |
| `/gsdt:thread [nome]` | Gerencia threads persistentes |

---

## Exemplo rápido

```bash
/gsdt:new-project
/gsdt:discuss-phase 1
/gsdt:plan-phase 1
/gsdt:execute-phase 1
/gsdt:verify-work 1
/gsdt:ship 1
```
