# Sprint 1 – API + Catálogo

## Objetivo
- Publicar API estável do catálogo e dados públicos; servir build do front pelo Express.

## Stories
- [ ] Healthcheck `/api/health` responde 200 com timestamp
- [ ] Catálogo público: categorias, produtos, acessórios e detalhes por slug
- [ ] Checkout Stripe (mock quando sem chave)
- [ ] Admin: login JWT + rotas protegidas básicas
- [ ] Observabilidade: logs de erro/sucesso + CORS + rate limit simples
- [ ] Seed reproduzível (produtos, acessórios, blog, FAQs, depoimentos)

## DoD
- Smoke: Home, Destaque e Catálogo renderizam sem erros com dados de seed
- `npm run seed` idempotente; `curl /api/health` OK; build do front servido em `/:path`

## Riscos
- Concor­rência SQLite durante seed; mitigar rodando seed sem tráfego alto

## Links
- Runbook: `docs/runbook-sprint1.md`

