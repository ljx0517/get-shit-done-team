# Guia do Usuário do GSDT

Referência detalhada de workflows, troubleshooting e configuração. Para setup rápido, veja o [README](../../README.pt-BR.md).

---

## Sumário

- [Fluxo de trabalho](#fluxo-de-trabalho)
- [Contrato de UI](#contrato-de-ui)
- [Backlog e Threads](#backlog-e-threads)
- [Workstreams](#workstreams)
- [Segurança](#segurança)
- [Referência de comandos](#referência-de-comandos)
- [Configuração](#configuração)
- [Exemplos de uso](#exemplos-de-uso)
- [Troubleshooting](#troubleshooting)
- [Recuperação rápida](#recuperação-rápida)

---

## Fluxo de trabalho

Fluxo recomendado por fase:

1. `/gsdt:discuss-phase [N]` — trava preferências de implementação
2. `/gsdt:ui-phase [N]` — contrato visual para fases frontend
3. `/gsdt:plan-phase [N]` — pesquisa + plano + validação
4. `/gsdt:execute-phase [N]` — execução em ondas paralelas
5. `/gsdt:verify-work [N]` — UAT manual com diagnóstico
6. `/gsdt:ship [N]` — cria PR (opcional)

Para iniciar projeto novo:

```bash
/gsdt:new-project
```

Para seguir automaticamente o próximo passo:

```bash
/gsdt:next
```

### Nyquist Validation

Durante `plan-phase`, o GSDT pode mapear requisitos para comandos de teste automáticos antes da implementação. Isso gera `{phase}-VALIDATION.md` e aumenta a confiabilidade de verificação pós-execução.

Desativar:

```json
{
  "workflow": {
    "nyquist_validation": false
  }
}
```

### Modo de discussão por suposições

Com `workflow.discuss_mode: "assumptions"`, o GSDT analisa o código antes de perguntar, apresenta suposições estruturadas e pede apenas correções.

---

## Contrato de UI

### Comandos

| Comando | Descrição |
|---------|-----------|
| `/gsdt:ui-phase [N]` | Gera contrato de design `UI-SPEC.md` para a fase |
| `/gsdt:ui-review [N]` | Auditoria visual retroativa em 6 pilares |

### Quando usar

- Rode `/gsdt:ui-phase` depois de `/gsdt:discuss-phase` e antes de `/gsdt:plan-phase`.
- Rode `/gsdt:ui-review` após execução/validação para avaliar qualidade visual e consistência.

### Configurações relacionadas

| Setting | Padrão | O que controla |
|---------|--------|----------------|
| `workflow.ui_phase` | `true` | Gera contratos de UI para fases frontend |
| `workflow.ui_safety_gate` | `true` | Ativa gate de segurança para componentes de registry |

---

## Backlog e Threads

### Backlog (999.x)

Ideias fora da sequência ativa vão para backlog:

```bash
/gsdt:add-backlog "Camada GraphQL"
/gsdt:add-backlog "Responsividade mobile"
```

Promover/revisar:

```bash
/gsdt:review-backlog
```

### Seeds

Seeds guardam ideias futuras com condição de gatilho:

```bash
/gsdt:plant-seed "Adicionar colaboração real-time quando infra de WebSocket estiver pronta"
```

### Threads persistentes

Threads são contexto leve entre sessões:

```bash
/gsdt:thread
/gsdt:thread fix-deploy-key-auth
/gsdt:thread "Investigar timeout TCP"
```

---

## Workstreams

Workstreams permitem trabalho paralelo sem colisão de estado de planejamento.

| Comando | Função |
|---------|--------|
| `/gsdt:workstreams create <name>` | Cria workstream isolado |
| `/gsdt:workstreams switch <name>` | Troca workstream ativo |
| `/gsdt:workstreams list` | Lista workstreams |
| `/gsdt:workstreams complete <name>` | Finaliza e arquiva workstream |

`workstreams` compartilham o mesmo código/git, mas isolam artefatos de `.gsdt-planning/`.

---

## Segurança

O GSDT aplica defesa em profundidade:

- prevenção de path traversal em entradas de arquivo
- detecção de prompt injection em texto do usuário
- hooks de proteção para escrita em `.gsdt-planning/`
- scanner CI para padrões de injeção em agentes/workflows/comandos

Para arquivos sensíveis, use deny list no Claude Code.

---

## Referência de comandos

### Fluxo principal

| Comando | Quando usar |
|---------|-------------|
| `/gsdt:new-project` | Início de projeto |
| `/gsdt:discuss-phase [N]` | Definir preferências antes do plano |
| `/gsdt:plan-phase [N]` | Criar e validar planos |
| `/gsdt:execute-phase [N]` | Executar planos em ondas |
| `/gsdt:verify-work [N]` | UAT manual |
| `/gsdt:ship [N]` | Gerar PR da fase |
| `/gsdt:next` | Próximo passo automático |

### Gestão e utilidades

| Comando | Quando usar |
|---------|-------------|
| `/gsdt:progress` | Ver status atual |
| `/gsdt:resume-work` | Retomar sessão |
| `/gsdt:pause-work` | Pausar com handoff |
| `/gsdt:session-report` | Resumo da sessão |
| `/gsdt:quick` | Tarefa ad-hoc com garantias GSDT |
| `/gsdt:debug [desc]` | Debug sistemático |
| `/gsdt:forensics` | Diagnóstico de workflow quebrado |
| `/gsdt:settings` | Ajustar workflow/modelos |
| `/gsdt:set-profile <profile>` | Troca rápida de perfil |

Para lista completa e flags avançadas, consulte [Command Reference](../COMMANDS.md).

---

## Configuração

Arquivo de configuração: `.gsdt-planning/config.json`

### Núcleo

| Setting | Opções | Padrão |
|---------|--------|--------|
| `mode` | `interactive`, `yolo` | `interactive` |
| `granularity` | `coarse`, `standard`, `fine` | `standard` |
| `model_profile` | `quality`, `balanced`, `budget`, `inherit` | `balanced` |

### Workflow

| Setting | Padrão |
|---------|--------|
| `workflow.research` | `true` |
| `workflow.plan_check` | `true` |
| `workflow.verifier` | `true` |
| `workflow.nyquist_validation` | `true` |
| `workflow.ui_phase` | `true` |
| `workflow.ui_safety_gate` | `true` |

### Perfis de modelo

| Perfil | Uso recomendado |
|--------|------------------|
| `quality` | trabalho crítico, maior qualidade |
| `balanced` | padrão recomendado |
| `budget` | reduzir custo de tokens |
| `inherit` | seguir modelo da sessão/runtime |

Detalhes completos: [Configuration Reference](../CONFIGURATION.md).

---

## Exemplos de uso

### Projeto novo

```bash
claude --dangerously-skip-permissions
/gsdt:new-project
/gsdt:discuss-phase 1
/gsdt:ui-phase 1
/gsdt:plan-phase 1
/gsdt:execute-phase 1
/gsdt:verify-work 1
/gsdt:ship 1
```

### Código já existente

```bash
/gsdt:map-codebase
/gsdt:new-project
```

### Correção rápida

```bash
/gsdt:quick
> "Corrigir botão de login no mobile Safari"
```

### Preparação para release

```bash
/gsdt:audit-milestone
/gsdt:plan-milestone-gaps
/gsdt:complete-milestone
```

---

## Troubleshooting

### "Project already initialized"

`.gsdt-planning/PROJECT.md` já existe. Apague `.gsdt-planning/` se quiser reiniciar do zero.

### Sessão longa degradando contexto

Use `/clear` entre etapas grandes e retome com `/gsdt:resume-work` ou `/gsdt:progress`.

### Plano desalinhado

Rode `/gsdt:discuss-phase [N]` antes do plano e valide suposições com `/gsdt:list-phase-assumptions [N]`.

### Execução falhou ou saiu com stubs

Replaneje com escopo menor (tarefas menores por plano).

### Custo alto

Use perfil budget:

```bash
/gsdt:set-profile budget
```

### Runtime não-Claude (Codex/Vibe Agent Team/Gemini)

Use `resolve_model_ids: "omit"` para deixar o runtime resolver modelos padrão.

---

## Recuperação rápida

| Problema | Solução |
|---------|---------|
| Perdeu contexto | `/gsdt:resume-work` ou `/gsdt:progress` |
| Fase deu errado | `git revert` + replanejar |
| Precisa alterar escopo | `/gsdt:add-phase`, `/gsdt:insert-phase`, `/gsdt:remove-phase` |
| Bug em workflow | `/gsdt:forensics` |
| Correção pontual | `/gsdt:quick` |
| Custo alto | `/gsdt:set-profile budget` |
| Não sabe próximo passo | `/gsdt:next` |

---

## Estrutura de arquivos do projeto

```text
.gsdt-planning/
  PROJECT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
  config.json
  MILESTONES.md
  HANDOFF.json
  research/
  reports/
  todos/
  debug/
  codebase/
  phases/
    XX-phase-name/
      XX-YY-PLAN.md
      XX-YY-SUMMARY.md
      CONTEXT.md
      RESEARCH.md
      VERIFICATION.md
      XX-UI-SPEC.md
      XX-UI-REVIEW.md
  ui-reviews/
```

> [!NOTE]
> Esta é a versão pt-BR do guia para uso diário. Para detalhes técnicos exatos e cobertura completa de parâmetros avançados, consulte também o [guia original em inglês](../USER-GUIDE.md).
