# Runbook Sprint 1 – API & Catálogo

## Objetivo
- Validar endpoints públicos do catálogo e produtos.
- Garantir fluxo de autenticação e CRUD admin mínimo.
- Exercitar criação de pedidos/checkout (Stripe ou mock).
- Monitorar saúde e limites do serviço.

## Pré-requisitos
- Node.js 18+ e npm instalados.
- Variáveis `.env` configuradas (`JWT_SECRET`, `STRIPE_SECRET_KEY` opcional).
- Banco SQLite inicializado via `npm run seed` no diretório `server`.
- Servidor iniciado com `npm run dev`.

## Scripts Úteis
- `cd server && npm run dev`: inicia API com hot reload.
- `cd server && npm test`: executa testes automatizados (a definir).
- `cd client && npm run dev`: levanta front para smoke visual.

## Cenários de Teste

### Catálogo Público
- `GET /acessorios` retorna lista com campos `id`, `name`, `price`, `image_url`.
- `GET /acessorios?categoria=temas-para-festas` filtra itens; slug inexistente devolve array vazio.
- `GET /acessorios/:id` responde 404 para ID inexistente e 400 para ID inválido.
- `GET /produtos` e `/produtos?categoria=<slug>` validam `servings_min`/`servings_max`.
- `GET /produtos/:id` segue mesmas validações de erro.

### Autenticação & Área Admin
- `POST /admin/login` com credencial seed devolve JWT + dados sanitizados; inválido → 401.
- Rotas protegidas (`/admin/acessorios`, `/admin/produtos`) exigem header Bearer; token expirado → 401 “Sessão expirada”.
- CRUD: `POST` cria registro com `slug` via `slugify`, `PUT` atualiza, `DELETE` remove. Confirmar persistência no banco.

### Checkout
- `POST /checkout` com Stripe ativo cria PaymentIntent; sem chave, retorna mock `{ status: "pending" }`.
- Requisição sem `items`, `total` ou `customer` → 422 com detalhes.
- Em status sucesso, log registra pedido e front limpa carrinho; cancelado mantém itens.

### Observabilidade & Resiliência
- `GET /health` responde 200 `{ "status": "ok" }`.
- Rate-limit dispara após limite configurado (esperado 429).
- Logs de erro/sucesso aparecem no console com contexto da rota.

## Execução Recomendada
- Usar coleção Insomnia/Postman com ambientes `local` e `homolog`.
- Rodar smoke diário: `/health`, `/acessorios`, `/admin/login`, `POST /checkout` (mock).
- Registrar resultados em planilha ou issue da sprint para rastreabilidade.
