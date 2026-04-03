<div align="center">

# GET SHIT DONE

[English](README.md) · **Português** · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md)

**Um sistema leve e poderoso de meta-prompting, engenharia de contexto e desenvolvimento orientado a especificação para Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Cursor e Antigravity.**

**Resolve context rot — a degradação de qualidade que acontece conforme o Claude enche a janela de contexto.**

[![npm version](https://img.shields.io/npm/v/gsdt?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/gsdt)
[![npm downloads](https://img.shields.io/npm/dm/gsdt?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/gsdt)
[![Tests](https://img.shields.io/github/actions/workflow/status/gsd-build/gsdt/test.yml?branch=main&style=for-the-badge&logo=github&label=Tests)](https://github.com/gsd-build/gsdt/actions/workflows/test.yml)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gsd)
[![X (Twitter)](https://img.shields.io/badge/X-@gsd__foundation-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/gsd_foundation)
[![$GSD Token](https://img.shields.io/badge/$GSD-Dexscreener-1C1C1C?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzAwRkYwMCIvPjwvc3ZnPg==&logoColor=00FF00)](https://dexscreener.com/solana/dwudwjvan7bzkw9zwlbyv6kspdlvhwzrqy6ebk8xzxkv)
[![GitHub stars](https://img.shields.io/github/stars/gsd-build/get-shit-done?style=for-the-badge&logo=github&color=181717)](https://github.com/gsd-build/get-shit-done)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npx gsdt@latest
```

**Funciona em Mac, Windows e Linux.**

<br>

![GSD Install](assets/terminal.svg)

<br>

*"Se você sabe claramente o que quer, isso VAI construir para você. Sem enrolação."*

*"Eu já usei SpecKit, OpenSpec e Taskmaster — este me deu os melhores resultados."*

*"De longe a adição mais poderosa ao meu Claude Code. Nada superengenheirado. Simplesmente faz o trabalho."*

<br>

**Confiado por engenheiros da Amazon, Google, Shopify e Webflow.**

[Por que eu criei isso](#por-que-eu-criei-isso) · [Como funciona](#como-funciona) · [Comandos](#comandos) · [Por que funciona](#por-que-funciona) · [Guia do usuário](docs/pt-BR/USER-GUIDE.md)

</div>

---

## Por que eu criei isso

Sou desenvolvedor solo. Eu não escrevo código — o Claude Code escreve.

Existem outras ferramentas de desenvolvimento orientado por especificação. BMAD, Speckit... Mas quase todas parecem mais complexas do que o necessário (cerimônias de sprint, story points, sync com stakeholders, retrospectivas, fluxos Jira) ou não entendem de verdade o panorama do que você está construindo. Eu não sou uma empresa de software com 50 pessoas. Não quero teatro corporativo. Só quero construir coisas boas que funcionem.

Então eu criei o GSD. A complexidade fica no sistema, não no seu fluxo. Por trás: engenharia de contexto, formatação XML de prompts, orquestração de subagentes, gerenciamento de estado. O que você vê: alguns comandos que simplesmente funcionam.

O sistema dá ao Claude tudo que ele precisa para fazer o trabalho *e* validar o resultado. Eu confio no fluxo. Ele entrega.

— **TÂCHES**

---

Vibe coding ganhou má fama. Você descreve algo, a IA gera código, e sai um resultado inconsistente que quebra em escala.

O GSD corrige isso. É a camada de engenharia de contexto que torna o Claude Code confiável.

---

## Para quem é

Para quem quer descrever o que precisa e receber isso construído do jeito certo — sem fingir que está rodando uma engenharia de 50 pessoas.

---

## Primeiros passos

```bash
npx gsdt@latest
```

O instalador pede:
1. **Runtime** — Claude Code, OpenCode, Gemini, Codex, Copilot, Cursor, Antigravity, ou todos
2. **Local** — Global (todos os projetos) ou local (apenas projeto atual)

Verifique com:
- Claude Code / Gemini: `/gsdt:help`
- OpenCode: `/gsdt-help`
- Codex: `$gsdt-help`
- Copilot: `/gsdt:help`
- Antigravity: `/gsdt:help`

> [!NOTE]
> A instalação do Codex usa skills (`skills/gsdt-*/SKILL.md`) em vez de prompts customizados.

### Mantendo atualizado

```bash
npx gsdt@latest
```

<details>
<summary><strong>Instalação não interativa (Docker, CI, Scripts)</strong></summary>

```bash
# Claude Code
npx gsdt --claude --global
npx gsdt --claude --local

# OpenCode
npx gsdt --opencode --global

# Gemini CLI
npx gsdt --gemini --global

# Codex
npx gsdt --codex --global
npx gsdt --codex --local

# Copilot
npx gsdt --copilot --global
npx gsdt --copilot --local

# Cursor
npx gsdt --cursor --global
npx gsdt --cursor --local

# Antigravity
npx gsdt --antigravity --global
npx gsdt --antigravity --local

# Todos
npx gsdt --all --global
```

Use `--global` (`-g`) ou `--local` (`-l`) para pular a pergunta de local.
Use `--claude`, `--opencode`, `--gemini`, `--codex`, `--copilot`, `--cursor`, `--antigravity` ou `--all` para pular a pergunta de runtime.

</details>

### Recomendado: modo sem permissões

```bash
claude --dangerously-skip-permissions
```

> [!TIP]
> Esse é o modo pensado para o GSD: aprovar `date` e `git commit` 50 vezes mata a produtividade.

---

## Como funciona

> **Já tem código?** Rode `/gsdt:map-codebase` primeiro para analisar stack, arquitetura, convenções e riscos.

### 1. Inicializar projeto

```
/gsdt:new-project
```

O sistema:
1. **Pergunta** até entender seu objetivo
2. **Pesquisa** o domínio com agentes em paralelo
3. **Extrai requisitos** (v1, v2 e fora de escopo)
4. **Monta roadmap** por fases

**Cria:** `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `.claude/.gsdt-planning/research/`

### 2. Discutir fase

```
/gsdt:discuss-phase 1
```

Captura suas preferências de implementação antes do planejamento.

**Cria:** `{phase_num}-CONTEXT.md`

### 3. Planejar fase

```
/gsdt:plan-phase 1
```

1. Pesquisa abordagens
2. Cria 2-3 planos atômicos em XML
3. Verifica contra os requisitos

**Cria:** `{phase_num}-RESEARCH.md`, `{phase_num}-{N}-PLAN.md`

### 4. Executar fase

```
/gsdt:execute-phase 1
```

1. Executa planos em ondas
2. Contexto novo por plano
3. Commit atômico por tarefa
4. Verifica contra objetivos

**Cria:** `{phase_num}-{N}-SUMMARY.md`, `{phase_num}-VERIFICATION.md`

### 5. Verificar trabalho

```
/gsdt:verify-work 1
```

Validação manual orientada para confirmar que a feature realmente funciona como esperado.

**Cria:** `{phase_num}-UAT.md` e planos de correção se necessário

### 6. Repetir -> Entregar -> Completar

```
/gsdt:discuss-phase 2
/gsdt:plan-phase 2
/gsdt:execute-phase 2
/gsdt:verify-work 2
/gsdt:ship 2
/gsdt:complete-milestone
/gsdt:new-milestone
```

Ou deixe o GSD decidir:

```
/gsdt:next
```

### Modo rápido

```
/gsdt:quick
```

Para tarefas ad-hoc sem ciclo completo de planejamento.

---

## Por que funciona

### Engenharia de contexto

| Arquivo | Papel |
|---------|-------|
| `PROJECT.md` | Visão do projeto |
| `research/` | Conhecimento do ecossistema |
| `REQUIREMENTS.md` | Escopo v1/v2 |
| `ROADMAP.md` | Direção e progresso |
| `STATE.md` | Memória entre sessões |
| `PLAN.md` | Tarefa atômica com XML |
| `SUMMARY.md` | O que mudou |
| `todos/` | Ideias para depois |
| `threads/` | Contexto persistente |
| `seeds/` | Ideias para próximos marcos |

### Formato XML de prompt

```xml
<task type="auto">
  <name>Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>
    Use jose for JWT (not jsonwebtoken - CommonJS issues).
    Validate credentials against users table.
    Return httpOnly cookie on success.
  </action>
  <verify>curl -X POST localhost:3000/api/auth/login returns 200 + Set-Cookie</verify>
  <done>Valid credentials return cookie, invalid return 401</done>
</task>
```

### Orquestração multiagente

Um orquestrador leve chama agentes especializados para pesquisa, planejamento, execução e verificação.

### Commits atômicos

Cada tarefa gera commit próprio, facilitando `git bisect`, rollback e rastreabilidade.

---

## Comandos

### Fluxo principal

| Comando | O que faz |
|---------|-----------|
| `/gsdt:new-project [--auto]` | Inicializa projeto completo |
| `/gsdt:discuss-phase [N] [--auto] [--analyze]` | Captura decisões antes do plano |
| `/gsdt:plan-phase [N] [--auto] [--reviews]` | Pesquisa + plano + validação |
| `/gsdt:execute-phase <N>` | Executa planos em ondas paralelas |
| `/gsdt:verify-work [N]` | UAT manual |
| `/gsdt:ship [N] [--draft]` | Cria PR da fase validada |
| `/gsdt:next` | Avança automaticamente para o próximo passo |
| `/gsdt:fast <text>` | Tarefas triviais sem planejamento |
| `/gsdt:complete-milestone` | Fecha o marco e marca release |
| `/gsdt:new-milestone [name]` | Inicia próximo marco |

### Qualidade e utilidades

| Comando | O que faz |
|---------|-----------|
| `/gsdt:review` | Peer review com múltiplas IAs |
| `/gsdt:pr-branch` | Cria branch limpa para PR |
| `/gsdt:settings` | Configura perfis e agentes |
| `/gsdt:set-profile <profile>` | Troca perfil (quality/balanced/budget/inherit) |
| `/gsdt:quick [--full] [--discuss] [--research]` | Execução rápida com garantias do GSD |
| `/gsdt:health [--repair]` | Verifica e repara `.claude/.gsdt-planning/` |

> Para a lista completa de comandos e opções, use `/gsdt:help`.

---

## Configuração

As configurações do projeto ficam em `.claude/.gsdt-planning/config.json`.
Você pode configurar no `/gsdt:new-project` ou ajustar depois com `/gsdt:settings`.

### Ajustes principais

| Configuração | Opções | Padrão | Controle |
|--------------|--------|--------|----------|
| `mode` | `yolo`, `interactive` | `interactive` | Autoaprovar vs confirmar etapas |
| `granularity` | `coarse`, `standard`, `fine` | `standard` | Granularidade de fases/planos |

### Perfis de modelo

| Perfil | Planejamento | Execução | Verificação |
|--------|--------------|----------|-------------|
| `quality` | Opus | Opus | Sonnet |
| `balanced` | Opus | Sonnet | Sonnet |
| `budget` | Sonnet | Sonnet | Haiku |
| `inherit` | Inherit | Inherit | Inherit |

Troca rápida:
```
/gsdt:set-profile budget
```

---

## Segurança

### Endurecimento embutido

O GSD inclui proteções como:
- prevenção de path traversal
- detecção de prompt injection
- validação de argumentos de shell
- parsing seguro de JSON
- scanner de injeção para CI

### Protegendo arquivos sensíveis

Adicione padrões sensíveis ao deny list do Claude Code:

```json
{
  "permissions": {
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/secrets/*)",
      "Read(**/*credential*)",
      "Read(**/*.pem)",
      "Read(**/*.key)"
    ]
  }
}
```

---

## Solução de problemas

**Comandos não apareceram após instalar?**
- Reinicie o runtime
- Verifique se os arquivos foram instalados no diretório correto

**Comandos não funcionam como esperado?**
- Rode `/gsdt:help`
- Reinstale com `npx gsdt@latest`

**Em Docker/container?**
- Defina `CLAUDE_CONFIG_DIR` antes da instalação:

```bash
CLAUDE_CONFIG_DIR=/home/youruser/.claude npx gsdt --global
```

### Desinstalar

```bash
# Instalações globais
npx gsdt --claude --global --uninstall
npx gsdt --opencode --global --uninstall
npx gsdt --gemini --global --uninstall
npx gsdt --codex --global --uninstall
npx gsdt --copilot --global --uninstall
npx gsdt --cursor --global --uninstall
npx gsdt --antigravity --global --uninstall

# Instalações locais (projeto atual)
npx gsdt --claude --local --uninstall
npx gsdt --opencode --local --uninstall
npx gsdt --gemini --local --uninstall
npx gsdt --codex --local --uninstall
npx gsdt --copilot --local --uninstall
npx gsdt --cursor --local --uninstall
npx gsdt --antigravity --local --uninstall
```

---

## Community Ports

OpenCode, Gemini CLI e Codex agora são suportados nativamente via `npx gsdt`.

| Projeto | Plataforma | Descrição |
|---------|------------|-----------|
| [gsdt-opencode](https://github.com/rokicool/gsdt-opencode) | OpenCode | Adaptação original para OpenCode |
| gsdt-gemini (archived) | Gemini CLI | Adaptação original para Gemini por uberfuzzy |

---

## Star History

<a href="https://star-history.com/#gsd-build/get-shit-done&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=gsd-build/get-shit-done&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=gsd-build/get-shit-done&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=gsd-build/get-shit-done&type=Date" />
 </picture>
</a>

---

## Licença

Licença MIT. Veja [LICENSE](LICENSE).

---

<div align="center">

**Claude Code é poderoso. O GSD o torna confiável.**

</div>
