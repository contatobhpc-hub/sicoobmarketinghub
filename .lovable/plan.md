# Marketing Hub — Arquitetura do Marketing OS (Sicoob Credibelo)

Plataforma SaaS interna para centralizar 100% da operação do Departamento de Comunicação e Marketing. Não é um gerenciador de tarefas — é um **Marketing Operating System** onde Campanha é a entidade-mãe e todos os módulos se conectam a ela.

---

## 1. Princípios de Arquitetura

1. **Campaign-centric**: toda ação (tarefa, post, contrato, evento, mídia) nasce ou se vincula a uma Campanha.
2. **Event-driven**: criar uma Campanha dispara automações (gera tasks, entradas no calendário, briefs de criativo, etc.) via triggers no banco + jobs.
3. **Single source of truth**: cada entidade vive em um módulo, mas é referenciada por todos.
4. **Multi-tenant ready** (mesmo sendo interno hoje): `organization_id` em tudo.
5. **RBAC granular**: papéis distintos (Diretor, Gestor, Analista, Designer, Social Media, Convidado).
6. **Auditável**: `activity_log` em todas as entidades críticas.

---

## 2. Módulos (12)

| # | Módulo | Propósito |
|---|--------|-----------|
| 1 | **Campanhas** | Núcleo. Objetivo, público, orçamento, KPIs, período. Origem de tudo. |
| 2 | **Planejamento** | Plano anual, OKRs, metas trimestrais, roadmap estratégico. |
| 3 | **Tarefas & Projetos** | Kanban/Lista/Gantt. Subtarefas, dependências, sprints. |
| 4 | **Calendário Editorial** | Visão unificada (posts, eventos, campanhas, prazos). |
| 5 | **Conteúdo & Criativos** | Briefs, aprovações, versões, DAM (biblioteca de assets). |
| 6 | **Social Media** | Posts agendados por canal (IG, FB, LinkedIn, TikTok, YouTube). |
| 7 | **Mídia Offline** | Outdoor, rádio, jornal, banner agência, brindes. Estoque + alocação. |
| 8 | **Eventos** | Patrocínios, ativações, feiras. Checklist, fornecedores, ROI. |
| 9 | **Contratos & Fornecedores** | Vigência, valores, renovação, anexos, alertas. |
| 10 | **Orçamento & Financeiro** | Budget por campanha/módulo, realizado vs planejado. |
| 11 | **Indicadores (BI)** | Dashboards: alcance, engajamento, conversão, ROI, SLA interno. |
| 12 | **Automação & Integrações** | Regras (if/then), webhooks, Meta/Google Ads, RD Station, e-mail. |

Transversais: **Notificações**, **Comentários/Menções**, **Aprovações**, **Configurações**, **Usuários & Permissões**.

---

## 3. Entidades Principais (Banco)

```text
organizations (1)
└── users ──< user_roles >── roles
     │
     ├── campaigns (núcleo)
     │    ├── campaign_objectives
     │    ├── campaign_kpis
     │    ├── campaign_budget_items
     │    └── campaign_channels  (social | offline | event | email | ads)
     │
     ├── tasks ──< task_assignees, task_dependencies, subtasks, task_comments
     │    └── (campaign_id?, project_id?)
     │
     ├── projects ──< project_members
     │
     ├── calendar_events  (type: post|task|event|deadline|campaign_phase)
     │
     ├── content_briefs ──< creative_assets ──< asset_versions
     │    └── approvals  (polimórfica: target_type, target_id)
     │
     ├── social_posts  (campaign_id?, asset_id?, channel, scheduled_at, status)
     │
     ├── offline_media  (type: outdoor|radio|print|merch, location, period)
     │    └── offline_media_allocations (campaign_id)
     │
     ├── events  (campaign_id?, venue, date, budget)
     │    ├── event_checklist_items
     │    └── event_suppliers
     │
     ├── suppliers
     ├── contracts  (supplier_id, campaign_id?, value, start, end, file)
     │
     ├── budgets  (period, total) ──< budget_lines (campaign_id, category)
     │
     ├── kpi_snapshots  (entity_type, entity_id, metric, value, date)
     │
     ├── automations  (trigger_type, conditions_json, actions_json)
     │    └── automation_runs
     │
     ├── notifications (user_id, type, payload, read_at)
     ├── comments      (polimórfica)
     ├── activity_log  (polimórfica, who/what/when)
     └── attachments   (polimórfica, storage_path)
```

**Polimorfia**: `approvals`, `comments`, `activity_log`, `attachments`, `kpi_snapshots` usam `(target_type, target_id)` para se ligar a qualquer entidade.

---

## 4. Relacionamentos-Chave (o que torna isto um "OS")

```text
              ┌──────────────┐
              │  CAMPAIGN    │ ◄── entidade-mãe
              └──────┬───────┘
   ┌──────┬──────┬───┼────┬──────┬──────┬──────┐
   ▼      ▼      ▼   ▼    ▼      ▼      ▼      ▼
 Tasks  Posts  Events Offline Briefs Contracts Budget KPIs
   │      │      │     │       │       │        │     │
   └──────┴──────┴─────┴───────┴───────┴────────┴─────┘
                       ▼
                Calendar (view unificada)
                       ▼
              Indicadores / BI
```

**Automação ao criar Campanha** (exemplo de regra default):
1. Cria registro em `calendar_events` (fase de planejamento, execução, encerramento).
2. Gera `tasks` a partir de template (briefing, criativo, aprovação, veiculação, relatório).
3. Cria `content_briefs` placeholders por canal selecionado.
4. Cria `social_posts` rascunho por data prevista.
5. Reserva linha em `budget_lines`.
6. Abre `kpi_snapshots` esperados (meta vs realizado).
7. Notifica responsáveis.

---

## 5. Fluxo de Telas (Navegação)

```text
[Login / SSO]
     │
     ▼
[Dashboard Home]  ── widgets: campanhas ativas, tarefas do dia, próximos posts, alertas de contrato, orçamento consumido
     │
     ├── Planejamento
     │    ├── Plano Anual
     │    ├── OKRs / Metas
     │    └── Roadmap
     │
     ├── Campanhas
     │    ├── Lista / Kanban por status
     │    └── Detalhe da Campanha (tabs: Visão | Tarefas | Conteúdo | Posts | Mídia Offline | Eventos | Contratos | Orçamento | KPIs | Timeline)
     │
     ├── Tarefas
     │    ├── Minhas Tarefas
     │    ├── Por Projeto
     │    └── Kanban / Lista / Gantt
     │
     ├── Calendário  (filtros: módulo, canal, campanha, responsável)
     │
     ├── Conteúdo
     │    ├── Briefs
     │    ├── Aprovações
     │    └── Biblioteca de Assets (DAM)
     │
     ├── Social Media
     │    ├── Planner (grid de agendamentos)
     │    └── Detalhe do Post (preview por canal)
     │
     ├── Mídia Offline
     │    ├── Inventário
     │    └── Alocações por Campanha
     │
     ├── Eventos
     │    ├── Lista
     │    └── Detalhe (checklist, fornecedores, custos)
     │
     ├── Contratos & Fornecedores
     │    ├── Fornecedores
     │    └── Contratos (com alertas de vencimento)
     │
     ├── Orçamento
     │    ├── Visão Geral
     │    └── Por Campanha / Categoria
     │
     ├── Indicadores (BI)
     │    ├── Dashboard Executivo
     │    ├── Performance por Campanha
     │    └── Produtividade do Time
     │
     ├── Automações
     │    ├── Regras
     │    └── Integrações (Meta, Google, RD, e-mail)
     │
     └── Configurações
          ├── Usuários & Papéis
          ├── Templates (campanha, tarefa, brief)
          ├── Canais e Marcas
          └── Auditoria
```

---

## 6. Componentes Reutilizáveis (UI)

- `AppShell` (sidebar + topbar + breadcrumb + notificações)
- `EntityHeader` (título, status, responsáveis, ações)
- `TabsLayout` (usado em detalhe de Campanha, Evento, Projeto)
- `KanbanBoard`, `DataTable`, `GanttChart`, `CalendarView`
- `CommentsPanel`, `ActivityFeed`, `AttachmentsList`, `ApprovalFlow`
- `KpiCard`, `ChartCard`, `BudgetBar`
- `AssetPicker`, `CampaignPicker`, `UserPicker` (selects globais reutilizáveis)
- `AutomationRuleBuilder` (if/then visual)
- `NotificationCenter`, `CommandPalette` (Ctrl+K)

---

## 7. Papéis e Permissões

| Papel | Permissões-chave |
|-------|------------------|
| Diretor | Tudo + aprovação final + BI executivo |
| Gestor | CRUD em campanhas/orçamento, aprova conteúdo |
| Analista | Cria tarefas, posts, briefs |
| Designer | Recebe briefs, sobe assets, versiona |
| Social Media | Agenda e publica posts |
| Convidado | Somente leitura em campanhas atribuídas |

RBAC via tabela `user_roles` + função `has_role()` (security definer) usada nas RLS policies.

---

## 8. Stack Técnica Proposta

- Frontend: TanStack Start (já configurado) + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Postgres + Auth + Storage + Edge Functions)
- Realtime: subscriptions para notificações, comentários, kanban
- Storage: assets criativos, contratos PDF, anexos
- Jobs: pg_cron para alertas (contrato vencendo, post pendente, KPI atrasado)
- Integrações futuras via Edge Functions: Meta Graph API, Google Ads, RD Station, e-mail transacional

---

## 9. Roadmap de Implementação (sugerido para fases futuras)

1. **Fase 0 — Fundação**: Auth, RBAC, AppShell, organização, usuários.
2. **Fase 1 — Núcleo**: Campanhas + Tarefas + Calendário + Notificações.
3. **Fase 2 — Conteúdo**: Briefs, DAM, Aprovações, Social Posts.
4. **Fase 3 — Operação**: Mídia Offline, Eventos, Contratos, Orçamento.
5. **Fase 4 — Inteligência**: BI, KPIs, Automações, Integrações externas.

---

## 10. Próximos Passos

Confirme/ajuste antes de eu propor a Fase 0:

1. Os 12 módulos estão completos ou falta algum (ex.: CRM de associados, Atendimento/SAC, PR/Imprensa)?
2. Os 6 papéis cobrem a realidade do time, ou precisamos de mais granularidade?
3. Integrações externas prioritárias para o MVP (Meta, Google, RD, e-mail) — quais entram na Fase 1?
4. Idioma único PT-BR ou preparar i18n desde já?
