# Sprint 2 – Editor MVP

## Objetivo
- Permitir criar/editar páginas dinâmicas via admin sem drag-and-drop, com versionamento e preview.

## Stories
- [ ] CRUD de páginas: título, slug, status (draft/published)
- [ ] Seções: criar/editar/remover; mover com setas; posições estáveis
- [ ] Componentes: criar/editar/remover; mover com setas; templates por tipo
- [ ] Versionamento: criar/listar/restaurar versões
- [ ] Preview em tempo real (lado direito) usando `PageRenderer`

## DoD
- Criar página, adicionar 2 seções e 4 componentes e publicar; restaurar versão anterior com sucesso

## Riscos
- Validação JSON dos props/settings no admin; tratar erros de forma clara

## Links
- Editor: `client/src/pages/admin/PageEditor.jsx`
- Render: `client/src/components/dynamic/*`

