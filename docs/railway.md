# Railway – Deploy sem atrito

## Opção A — Dockerfile (recomendada)
1) No serviço do Railway, habilite “Deploy from GitHub”.
2) Em Settings → Build, selecione “Dockerfile” (raiz do repo).
3) Deploy: nenhum comando extra necessário; o Dockerfile:
   - Instala deps do server e do client
   - Faz build do client (`client/dist`)
   - Copia o server e instala somente deps de produção
   - Executa `node src/app.js`

Variáveis (Settings → Variables):
- `NODE_ENV=production`
- `JWT_SECRET=<chave-segura>`
- `JWT_EXPIRES_IN=12h`
- `CORS_ORIGINS=https://teu-frontend.com` (ou `*` só em testes)
- `STRIPE_SECRET_KEY=sk_test_...` (opcional)
- (futuro) `SUPABASE_URL`, `SUPABASE_ANON_KEY`

Validação:
- `GET /api/health` → status ok + uptime + version
- `GET /` → SPA do client

## Opção B — Nixpacks (sem Dockerfile)
1) Root/Service directory: `server`
2) Install: `npm ci`
3) Build: vazio (o `postinstall` do server builda o client)
4) Start: `npm start`

Se preferir root `/`, use:
- Build: `npm --prefix server ci && npm --prefix client ci && npm --prefix client run build`
- Start: `npm --prefix server start`

