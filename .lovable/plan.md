
# Etapa 1 — Arquitetura relacional (Onda 1)

## Estratégia: "linha por entidade + JSONB"

Em vez de explodir cada campo aninhado (timeline, checklist, files, campanhas, etc.) em dezenas de tabelas, cada entidade vira **uma linha** com colunas relacionais para o que importa (id, user_id, nome, status, datas, timestamps) e um `data JSONB` para o restante. Vantagens:

- DELETE real por linha (fim do problema "voltou depois de excluir").
- RLS e índices por usuário.
- Mutações concorrentes não sobrescrevem tudo — cada `upsert` toca apenas a linha alterada.
- Migração de dados simples (uma linha por item do array atual).
- Sem `app_state` no caminho quente destes 4 módulos.

## Escopo desta etapa

### 1. Novas tabelas (com RLS + GRANTs)

Todas com `id uuid PK`, `user_id uuid NOT NULL` (FK `auth.users`), `data jsonb NOT NULL`, `created_at`, `updated_at`, trigger de `updated_at`, índice `(user_id)`, RLS `user_id = auth.uid()`.

- `partners` — colunas: `company text`, `category text`, `status text`, `contract_end date`
- `contracts` — colunas: `title text`, `partner_id uuid`, `status text`, `end_date date`
- `campaigns` — colunas: `name text`, `status text`, `start_date date`, `end_date date`
- `calendar_events` — colunas: `title text`, `event_date date`, `kind text`

### 2. Camada de acesso `src/lib/entity-store.ts`

Fábrica genérica que dá a cada módulo:

- `list(userId)` → SELECT
- `upsert(row)` → INSERT/UPDATE
- `remove(id)` → DELETE
- `subscribeRealtime(userId, onChange)` → canal Supabase Realtime opcional
- Cache local em `localStorage` (offline-first) + reconciliação por `updated_at`

### 3. Refactor dos 4 módulos

`partners.ts`, `contracts.ts`, `campaigns.ts`, `calendar.ts` deixam de chamar `scheduleModulePush("<mod>", …)` e passam a chamar a nova camada. API pública (`partnersStore.add/update/remove`, hooks `usePartners()`, etc.) fica idêntica — nenhuma tela precisa mudar.

### 4. Migração de dados existentes

Server function `migrateOnda1` (chamada uma vez por usuário no primeiro login pós-deploy):

1. Lê `app_state` do usuário para os 4 módulos.
2. Insere cada item como linha nas novas tabelas (`ON CONFLICT DO NOTHING` por id).
3. Marca sucesso em `app_state.data.__migrated_onda1 = true` para não repetir.
4. Depois de migrado, deleta os 4 registros de `app_state` desse usuário.

### 5. Desativação imediata do `app_state` (para estes 4 módulos)

- Após migração bem-sucedida, o código não lê nem escreve mais `app_state` para partners/contracts/campaigns/calendar.
- Financeiro e demais módulos continuam usando `app_state` até serem migrados nas ondas seguintes.
- Backup JSON (`marketing-hub-backup-2026-07-09.json`) já está salvo como rede de segurança.

## Detalhes técnicos

- Todas as tabelas em `public` com bloco obrigatório: `CREATE TABLE` → `GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated; GRANT ALL TO service_role;` → `ENABLE RLS` → `CREATE POLICY user_id = auth.uid()`.
- Trigger `set_updated_at` reaproveitada (já existe no projeto).
- Tombstones locais (`deletions.ts`) permanecem como camada de proteção adicional, mas deixam de ser a fonte da verdade — DELETE real no banco é.
- Realtime: opcional nesta etapa, desligado por padrão para evitar chatter.

## Ordem de execução

1. Migration SQL (4 tabelas + policies).
2. `entity-store.ts` (camada genérica).
3. Server function `migrateOnda1` + hook no login.
4. Refactor `partners.ts` → validar.
5. Refactor `contracts.ts`, `campaigns.ts`, `calendar.ts`.
6. Remover chamadas a `scheduleModulePush` desses 4 módulos.

## Fora do escopo desta etapa

- Financeiro (já é relacional em parte, tratado em onda separada).
- Mídia offline, fornecedores extras, etc.
- Multi-usuário / compartilhamento (Etapa 4).

Aprovar para começar pela migration SQL?
