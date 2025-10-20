# Sprint 1 — Issues (API + Catálogo)

- Sprint window: 2025-10-20 → 2025-10-24
- Goal: API estável, seeds reproduzíveis e front servido pelo Express

1) I-1 Healthcheck API
- Owner: Backend
- Description: Implementar `/api/health` com timestamp
- Acceptance: `200 { status:"ok" }`
- Estimate: 1h
- Due: 2025-10-20

2) I-2 Categorias (produtos)
- Owner: Backend
- Description: `GET /api/categories` com `product_count`
- Acceptance: lista ordenada; 500 tratado
- Estimate: 3h
- Due: 2025-10-21

3) I-3 Produtos
- Owner: Backend
- Description: `GET /api/products` + filtro `category, featured`; `GET /api/products/:slug`
- Acceptance: JSON mapeado; 404/400 corretos
- Estimate: 4h
- Due: 2025-10-21

4) I-4 Acessórios
- Owner: Backend
- Description: `GET /api/accessories/categories`, `GET /api/accessories`, `GET /api/accessories/:slug`
- Acceptance: contagem por categoria; paginação simples opcional
- Estimate: 4h
- Due: 2025-10-22

5) I-5 Checkout Stripe (mock sem chave)
- Owner: Backend
- Description: `POST /api/checkout/session` com validações
- Acceptance: retorna sessionId ou mock `{status:"pending"}`
- Estimate: 5h
- Due: 2025-10-23

6) I-6 Autenticação Admin
- Owner: Backend
- Description: `POST /api/auth/login`, `GET /api/auth/me`, middleware `requireAuth`
- Acceptance: JWT expira; erros 401/403 padronizados
- Estimate: 3h
- Due: 2025-10-22

7) I-7 Observabilidade e Segurança
- Owner: Backend
- Description: logs estruturados, CORS, rate-limit simples
- Acceptance: limites aplicados; logs em console
- Estimate: 3h
- Due: 2025-10-23

8) I-8 Seeds e Runbook
- Owner: Backend
- Description: `npm run seed` idempotente; runbook atualizado
- Acceptance: banco populado e documento `docs/runbook-sprint1.md`
- Estimate: 3h
- Due: 2025-10-20

9) I-9 Servir front
- Owner: Backend
- Description: servir `client/dist` em rotas não-`/api`
- Acceptance: `GET /` entrega SPA build
- Estimate: 1h
- Due: 2025-10-20

Risks: concorrência SQLite; mitigar rodando seed fora de tráfego.

