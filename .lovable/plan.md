# Marketing Hub — Arquitetura do Marketing OS (Sicoob Credibelo)

Plataforma SaaS interna para centralizar 100% da operação do Departamento de Comunicação e Marketing. Não é um gerenciador de tarefas — é um **Marketing Operating System** onde Campanha é a entidade-mãe e todos os módulos se conectam a ela.

---

## 1. Princípios de Arquitetura

1. **Campaign-centric**: toda ação (tarefa, post, contrato, evento, mídia) nasce ou se vincula a uma Campanha.
2. **Event-driven**: criar uma Campanha dispara automações (gera tasks, calendário, briefs, posts, budget) via triggers + jobs.
3. **Modelo de dados unificado**: cada entidade vive em um único módulo e é referenciada pelos demais — zero duplicidade.
4. **Modular e escalável**: novos módulos plugam no core sem refatorar; contratos de dados estáveis entre módulos.
5. **Multi-tenant ready**: `organization_id` em tudo (interno hoje, expansível amanhã).
6. **RBAC granular** com 6 papéis.
7. **Auditável**: `activity_log` em todas as entidades críticas.

---

## 2. Módulos (17)

### Núcleo Operacional
| # | Módulo | Propósito |
|---|--------|-----------|
| 1 | **Campanhas** | Núcleo. Objetivo, público, orçamento, KPIs, período. Origem de tudo. |
| 2 | **Planejamento** | Plano anual, OKRs, metas trimestrais, roadmap estratégico. |
| 3 | **Tarefas & Projetos** | Kanban/Lista/Gantt. Subtarefas, dependências, sprints. |
| 4 | **Calendário Editorial** | Visão unificada (posts, eventos, campanhas, prazos). |
| 5 | **Conteúdo & Criativos** | Briefs, versões, DAM (biblioteca de assets). |
| 6 | **Social Media** | Posts agendados por canal (IG, FB, LinkedIn, TikTok, YouTube). |
| 7 | **Mídia Offline** | Outdoor, rádio, jornal, brindes. Estoque + alocação. |
| 8 | **Eventos** | Patrocínios, ativações, feiras. Checklist, fornecedores, ROI. |
| 9 | **Contratos & Fornecedores** | Vigência, valores, renovação, anexos, alertas. |
| 10 | **Orçamento & Financeiro** | Budget por campanha/módulo, realizado vs planejado. |

### Estratégicos (incluídos nesta revisão)
| # | Módulo | Propósito |
|---|--------|-----------|
| 11 | **CRM de Relacionamentos & Demandas** | Solicitações internas das áreas da cooperativa. Briefings, SLA, status das entregas. |
| 12 | **Central de Aprovações** | Fluxo unificado para artes, campanhas, vídeos, roteiros, materiais (Diretoria + Gestores). |
| 13 | **Banco de Conteúdo** | Repositório pesquisável: legendas, matérias, roteiros, spots, comunicados, templates, institucional. |
| 14 | **Central de IA** | Assistente para gerar textos, briefings, cronogramas, checklists e ideias de campanha. |
| 15 | **Dashboard Executivo** | Painel gerencial: indicadores, resultados e SLA do departamento. |

### Inteligência & Automação
| # | Módulo | Propósito |
|---|--------|-----------|
| 16 | **Indicadores (BI)** | Dashboards operacionais: alcance, engajamento, conversão, ROI. |
| 17 | **Automação & Integrações** | Regras if/then, webhooks, integrações externas (gradual). |

Transversais: **Notificações**, **Comentários/Menções**, **Configurações**, **Usuários & Permissões**, **Auditoria**.

> Fora de escopo (declarado): CRM comercial de cooperados, SAC, atendimento ao cliente.

---

## 3. Entidades Principais (Banco)

```text
organizations (1)
└── users ──< user_roles >── roles
     │
     ├── campaigns  (núcleo)
     │    ├── campaign_objectives
     │    ├── campaign_kpis
     │    ├── campaign_budget_items
     │    └── campaign_channels
     │
     ├── tasks ──< task_assignees, task_dependencies, subtasks
     ├── projects ──< project_members
     ├── calendar_events  (type: post|task|event|deadline|campaign_phase|demand)
     │
     ├── content_briefs ──< creative_assets ──< asset_versions
     ├── social_posts
     ├── offline_media ──< offline_media_allocations
     ├── events ──< event_checklist_items, event_suppliers
     ├── suppliers
     ├── contracts
     ├── budgets ──< budget_lines
     │
     ├── demands                 (CRM interno: solicitante, área, briefing, SLA, status)
     │    └── demand_updates
     │
     ├── approvals               (polimórfica: target_type/target_id, approver_id, decision, comments)
     │    └── approval_steps     (fluxo multi-nível: ex. Analista → Gestor → Diretoria)
     │
     ├── content_library_items   (Banco de Conteúdo: type, tags, search_vector, file)
     │    └── content_library_tags
     │
     ├── ai_conversations        (Central de IA: contexto, prompt, output, target_type/target_id)
     │    └── ai_messages
     │
     ├── kpi_snapshots           (polimórfica)
     ├── automations ──< automation_runs
     ├── integrations            (config por provider: google_calendar, gmail, gdrive, meta, ga)
     │
     ├── notifications
     ├── comments                (polimórfica)
     ├── activity_log            (polimórfica)
     └── attachments             (polimórfica, storage_path)
```

**Polimorfia** via `(target_type, target_id)`: `approvals`, `comments`, `activity_log`, `attachments`, `kpi_snapshots`, `ai_conversations`. Garante que qualquer módulo novo herde esses recursos sem schema novo.

---

## 4. Relacionamentos-Chave (o "OS")

```text
        Demanda ──┐
                  ▼
              ┌──────────────┐
              │  CAMPAIGN    │ ◄── entidade-mãe
              └──────┬───────┘
   ┌──────┬──────┬───┼────┬──────┬──────┬──────┬──────┐
   ▼      ▼      ▼   ▼    ▼      ▼      ▼      ▼      ▼
 Tasks  Posts  Events Off  Briefs Contr  Budget KPIs  Conteúdo
   │      │      │    │     │      │      │     │       │
   └──────┴──────┴────┴─────┴──────┴──────┴─────┴───────┘
                       ▼                          ▲
                Calendar (unificado)         Central de IA
                       ▼                          │
              BI / Dashboard Executivo ◄──────────┘
                       ▲
              Central de Aprovações (transversal)
```

**Automação ao criar Campanha** (regra default): calendar_events de fases, tasks por template, content_briefs por canal, social_posts rascunho, budget_lines, kpi_snapshots esperados, notificações aos responsáveis.

**Automação ao criar Demanda**: cria task, abre fluxo de aprovação se necessário, notifica solicitante, gera entrada no calendário com SLA.

---

## 5. Fluxo de Telas (Navegação)

```text
[Login / SSO]
     │
     ▼
[Dashboard Home]  ── widgets: campanhas ativas, demandas abertas, aprovações pendentes, próximos posts, alertas
     │
     ├── Planejamento (Plano Anual, OKRs, Roadmap)
     ├── Campanhas (Lista/Kanban → Detalhe com tabs)
     ├── Demandas (CRM interno: inbox, kanban por status, SLA)
     ├── Aprovações (fila por papel, histórico, multi-step)
     ├── Tarefas (Minhas / Por Projeto / Kanban / Gantt)
     ├── Calendário (filtros: módulo, canal, campanha, responsável)
     ├── Conteúdo (Briefs, Aprovações de Arte, DAM)
     ├── Banco de Conteúdo (busca, tags, download, reuso)
     ├── Social Media (Planner + Detalhe do Post)
     ├── Mídia Offline (Inventário, Alocações)
     ├── Eventos (Lista, Detalhe, Checklist)
     ├── Contratos & Fornecedores
     ├── Orçamento (Geral, Por Campanha)
     ├── Central de IA (chat com contexto + ações: gerar brief, cronograma, copy, checklist)
     ├── Dashboard Executivo (visão Diretoria)
     ├── Indicadores (BI operacional)
     ├── Automações (Regras + Integrações)
     └── Configurações (Usuários & Papéis, Templates, Canais, Integrações, Auditoria)
```

---

## 6. Componentes Reutilizáveis (UI)

- `AppShell`, `EntityHeader`, `TabsLayout`, `Breadcrumbs`
- `KanbanBoard`, `DataTable`, `GanttChart`, `CalendarView`
- `CommentsPanel`, `ActivityFeed`, `AttachmentsList`
- `ApprovalFlow` (multi-step, usado em qualquer entidade)
- `KpiCard`, `ChartCard`, `BudgetBar`, `SLAIndicator`
- `AssetPicker`, `CampaignPicker`, `UserPicker`, `DemandPicker`
- `AutomationRuleBuilder`, `AIAssistantPanel` (drawer global Ctrl+I)
- `NotificationCenter`, `CommandPalette` (Ctrl+K), `GlobalSearch`

---

## 7. Papéis e Permissões (6)

| Papel | Permissões-chave |
|-------|------------------|
| **Administrador** | Controle total. Configurações, integrações, usuários, auditoria. |
| **Gestor de Marketing** | CRUD em campanhas/orçamento/demandas, aprova conteúdo, vê todos os indicadores. |
| **Analista de Marketing** | Cria campanhas, tarefas, conteúdos, posts, eventos. Edita o que cria/atribuído. |
| **Colaborador** | Só vê e executa tarefas atribuídas a ele. Comenta e atualiza status. |
| **Diretoria** | Read-only em dashboards, indicadores. Aprova nas etapas finais. |
| **Convidado/Parceiro** | Acesso restrito por escopo (campanha/evento/projeto compartilhado). |

RBAC via `user_roles` + função `has_role()` security definer. Escopo de Convidado via tabela `resource_access (user_id, target_type, target_id, level)`.

---

## 8. Stack Técnica

- Frontend: TanStack Start + Tailwind + shadcn/ui
- Backend: Lovable Cloud (Postgres + Auth + Storage + Server Functions)
- Realtime: notificações, comentários, kanban, aprovações
- Storage: assets, contratos, anexos, banco de conteúdo (com busca full-text via `tsvector`)
- Jobs: pg_cron (alertas de contrato, SLA de demanda, post pendente)
- IA: Lovable AI Gateway (chat, geração de texto, sumarização)

---

## 9. Integrações — Faseamento

**Fase 1 (MVP) — Alta prioridade**
- Google Calendar (sync de eventos/campanhas)
- E-mail transacional (notificações, lembretes, aprovações)
- Google Drive **ou** OneDrive (armazenamento de materiais)

**Fase 1 — Média prioridade**
- Meta Business Suite (somente leitura: calendário de publicações)
- Google Analytics (KPIs de campanha)

**Fase 2**
- Meta Ads, Google Ads, RD Station, WhatsApp Business API, Canva, OpenAI direta, Microsoft Teams, Power BI

> Foco do MVP: plataforma sólida e organizada. Integrações entram gradualmente.

---

## 10. Roadmap de Implementação

1. **Fase 0 — Fundação**: Auth, RBAC (6 papéis), AppShell, organização, usuários, configurações base, auditoria.
2. **Fase 1 — Núcleo + Demandas**: Campanhas, Tarefas, Calendário, Demandas (CRM interno), Notificações, Central de Aprovações.
3. **Fase 2 — Conteúdo**: Briefs, DAM, Social Posts, Banco de Conteúdo (busca), Central de IA básica.
4. **Fase 3 — Operação**: Mídia Offline, Eventos, Contratos, Orçamento.
5. **Fase 4 — Inteligência**: BI, Dashboard Executivo, Automações, Integrações Fase 1 (Calendar, E-mail, Drive).
6. **Fase 5 — Expansão**: Integrações Fase 2 + IA avançada.

---

## 11. Decisões Confirmadas

- 17 módulos (12 originais + 5 estratégicos). CRM comercial, SAC e atendimento estão **fora de escopo**.
- 6 papéis: Administrador, Gestor de Marketing, Analista, Colaborador, Diretoria, Convidado/Parceiro.
- Integrações: Fase 1 = Google Calendar + E-mail + Drive/OneDrive (alta) e Meta/GA (média). Demais na Fase 2+.
- Idioma: **PT-BR único** no MVP (i18n pode entrar depois sem refator graças à arquitetura modular).
- Arquitetura modular com modelo de dados unificado; novos módulos plugam sem reestruturar.

---

## 12. Próximo Passo

Confirmado o escopo acima, inicio a **Fase 0 — Fundação**:

1. Ativar Lovable Cloud (Auth + DB + Storage).
2. Criar schema base: `organizations`, `profiles`, enum `app_role` (6 papéis), `user_roles`, função `has_role()`, `activity_log`, `notifications`, `attachments`, `comments`.
3. Auth (e-mail/senha + Google) com auto-confirm em dev.
4. AppShell (sidebar com os 17 módulos como placeholders, topbar, notificações, command palette).
5. Tela de Configurações → Usuários & Papéis (CRUD de convites e papéis).

Quer que eu siga direto com a Fase 0?

---

## 11. Design System — UX (Marketing OS Premium)

Referências: Linear · Notion · Stripe · Brex · Ramp · Monday · ClickUp · Assiny.
Sensação alvo: *"estou usando o melhor software de Marketing do mercado."*

### 11.1 Princípios visuais
1. **Calmo, denso quando precisa, nunca poluído.** Hierarquia por tipografia e espaço — não por cor.
2. **Dark-first** com paleta Midnight Indigo. Tema claro como opção secundária.
3. **Glassmorphism sutil** apenas em overlays (command palette, modals, popovers, notification center). Nunca em cards de conteúdo.
4. **Movimento com propósito.** Micro-animações 120–240ms, easing `cubic-bezier(.2,.8,.2,1)`. Nada decorativo.
5. **Tokens, nunca hex hardcoded.** Tudo via `src/styles.css` + `@theme`.

### 11.2 Tokens (definidos em `src/styles.css`)
```
--background:        oklch(0.08 0.02 270)   /* #0a0a1a */
--surface:           oklch(0.14 0.04 270)   /* #141432 */
--surface-elevated:  oklch(0.18 0.06 270)
--border:            oklch(0.24 0.04 270 / .6)
--border-strong:     oklch(0.32 0.04 270)
--foreground:        oklch(0.98 0.01 270)
--muted-foreground:  oklch(0.68 0.02 270)
--primary:           oklch(0.62 0.22 274)   /* #4f46e5 indigo */
--primary-glow:      oklch(0.72 0.20 280)
--accent:            oklch(0.70 0.18 200)   /* ciano sutil para insights */
--success / warning / danger: tokens semânticos próprios
--gradient-primary:  linear-gradient(135deg, var(--primary), var(--primary-glow))
--gradient-mesh:     radial-gradient suave azul/roxo no fundo do dashboard
--shadow-sm:  0 1px 2px oklch(0 0 0 / .3)
--shadow-md:  0 8px 24px -8px oklch(0 0 0 / .5)
--shadow-glow: 0 0 40px oklch(0.62 0.22 274 / .25)
--radius: 12px (cards), 8px (inputs/buttons), 20px (modals)
```

### 11.3 Tipografia
- Heading: **Sora** (500/600/700). Tracking levemente negativo (-0.01em) em h1/h2.
- Body: **Manrope** (400/500/600). 14px base, 13px em tabelas densas, 15px em texto longo.
- Numerals: `font-variant-numeric: tabular-nums` em KPIs, valores monetários e tabelas.
- Escala: 12 / 13 / 14 / 16 / 20 / 24 / 32 / 40.

### 11.4 Layout global — AppShell
```
┌──────────────────────────────────────────────────────────┐
│ Sidebar (240px, collapsible 64px)  │   Topbar (56px)     │
│  • Logo Marketing Hub              │  ⌘K · breadcrumb ·  │
│  • Workspace switcher              │  filtros · avatar   │
│  • Nav (17 módulos agrupados)      ├─────────────────────┤
│  • Footer: ajuda · status · user   │                     │
│                                    │   Main (max 1440px) │
│                                    │                     │
└──────────────────────────────────────────────────────────┘
```
- Sidebar: fundo `--surface`, hover sutil, item ativo com barra indigo 2px à esquerda + bg `primary/8%`.
- Grupos no menu: **Operação** (Campanhas, Planejamento, Tarefas, Calendário) · **Conteúdo** (Conteúdo, Social, Banco, IA) · **Execução** (Mídia Offline, Eventos, Contratos, Orçamento) · **Inteligência** (BI, Dashboard Executivo, Automações) · **Relacionamento** (CRM Demandas, Aprovações) · **Config**.
- Topbar: Command Palette (⌘K) como ação primária, breadcrumb tipo Linear, notificações com dot indigo, avatar.

### 11.5 Componentes-chave (specs)
- **KpiCard**: 1 número grande (32px tabular), label muted 12px, delta (▲/▼) colorido, sparkline 40px. Hover: shadow-glow sutil.
- **CampaignCard**: header com status pill, título 16/600, progresso (barra fina indigo), 3 metadados (datas, owner, budget).
- **DataTable**: linhas 44px, divisor `border/40%`, hover `surface-elevated`, ações aparecem on-hover à direita.
- **KanbanBoard**: colunas 320px, cards arrastáveis com `scale(1.02)` + shadow no drag.
- **CalendarView**: estilo Linear/Notion — densidade alta, eventos com cor por canal/módulo.
- **CommandPalette**: glass (`backdrop-blur-xl bg-surface/70`), atalhos visíveis, navegação 100% teclado.
- **NotificationCenter**: slide-in direito, agrupado por dia, glass.
- **EntityHeader**: título grande, breadcrumb, tabs (Visão · Tarefas · Conteúdo · Orçamento · Aprovações · Atividades).
- **ApprovalFlow**: timeline vertical com avatares, status pills, comentário inline.
- **EmptyStates**: ilustração linear minimalista + 1 CTA primário.

### 11.6 Micro-animações (Framer Motion / CSS)
- Mount de páginas: `fade-in` + `translateY(8px → 0)`, 220ms.
- Cards em grid: stagger 40ms.
- Sidebar collapse: width transition 200ms.
- Hover em cards: `translateY(-2px)` + shadow-md, 160ms.
- Toasts: slide-in bottom-right + scale-in.
- Skeleton shimmer em loadings — nunca spinner genérico.
- Drag-and-drop com leve tilt e ghost translúcido.

### 11.7 Dashboard inteligente (home)
Layout em **bento dentro do shell sidebar**:
- Linha 1: 4 KpiCards (Campanhas ativas · Tarefas no prazo · Posts agendados · Orçamento usado).
- Linha 2 (2 col): **Campanhas em andamento** (lista) · **Calendário da semana** (mini).
- Linha 3 (3 col): **Aprovações pendentes** · **Demandas abertas (CRM)** · **Atividade recente**.
- Linha 4: **Insights da IA** (cartão com gradient-mesh sutil, sugestões contextuais).

### 11.8 Fluxos críticos (UX)
1. **Criar Campanha** → wizard 3 passos (Briefing · Canais & Budget · Automações a disparar) → após salvar, redireciona para a Campanha já com tarefas/calendário/briefs criados.
2. **Nova Demanda (CRM interno)** → form 1 tela com SLA automático → vira card de aprovação + task.
3. **Aprovar conteúdo** → preview lateral + botões Aprovar / Solicitar ajuste (com comentário obrigatório).
4. **Agendar post** → modal com preview por canal (mock real do feed) + calendário inline.

### 11.9 Acessibilidade
- Contraste AA mínimo em todos os tokens (AAA em textos longos).
- Foco visível com `ring-2 ring-primary/60` em todos os interativos.
- Navegação 100% por teclado, command palette como atalho universal.
- `prefers-reduced-motion` desativa stagger e parallax.

### 11.10 O que **NÃO** fazer
- Nada de gradiente roxo/rosa genérico de IA.
- Nada de bordas grossas, sombras pesadas ou neon.
- Nada de ícones coloridos no menu (apenas line icons monocromáticos — Lucide).
- Nada de modais gigantes — preferir side panels (drawer direito 480px).
- Nada de tabelas tipo Excel — sempre DataTable moderna com ações on-hover.
