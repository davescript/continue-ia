# Sprint 2 — Issues (Editor MVP)

- Sprint window: 2025-10-27 → 2025-11-01
- Goal: CRUD de páginas, seções e componentes com versionamento e preview

1) E-1 CRUD Páginas
- Owner: Frontend
- Description: listagem, criação, edição (título/slug/status), remoção
- Acceptance: atualiza `pages` e reflete no editor; validações 422/409
- Estimate: 6h
- Due: 2025-10-28

2) E-2 Seções (CRUD + ordem)
- Owner: Frontend
- Description: criar/editar/remover; mover com setas; posição persistente
- Acceptance: posições reordenadas sem conflitos; JSON válido em `settings`
- Estimate: 8h
- Due: 2025-10-29

3) E-3 Componentes (CRUD + ordem)
- Owner: Frontend
- Description: criar/editar/remover; templates por tipo; mover com setas
- Acceptance: render imediato no preview
- Estimate: 10h
- Due: 2025-10-30

4) E-4 Versionamento
- Owner: Frontend
- Description: criar/listar/restaurar/remover versões
- Acceptance: snapshot fiel; restauração funcional
- Estimate: 6h
- Due: 2025-10-31

5) E-5 UX/Validações
- Owner: Frontend
- Description: erros JSON claros, loading states, botões desabilitados
- Acceptance: sem crashes; mensagens amigáveis
- Estimate: 4h
- Due: 2025-10-31

6) E-6 Smoke E2E
- Owner: QA
- Description: criar página com 2 seções e 4 componentes, salvar versão e restaurar
- Acceptance: passos executados sem erro
- Estimate: 3h
- Due: 2025-11-01

Risks: entradas JSON inválidas; mitigar com validação e mensagens.

