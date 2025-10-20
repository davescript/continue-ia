# Atelier Aurora · Loja de Bolos Artesanais & Festas Personalizadas

Experiência completa para uma boutique especializada em bolos artísticos, doces finos e ambientações personalizadas para eventos. O projeto contempla frontend moderno em React, backend robusto em Node.js/Express e base de dados relacional em SQLite com conteúdo exemplo já populado.

## ✨ Principais recursos

- Landing page institucional com narrativa premium, destaques de produtos, experiências temáticas, depoimentos e blog.
- Área "Bolos sob medida" para solicitar orçamentos personalizados com combinações de sabores, recheios e acabamentos.
- Loja de acessórios com carrinho persistente e checkout Stripe funcional para peças e utilitários de festa.
- Seção de experiências para ambientações completas e portfólio navegável com filtros por tipo de evento.
- Blog com listagem, destaque editorial e página para cada matéria.
- Formulário de consultoria integrado ao backend, gerando protocolo de atendimento e gravando pedido no banco.
- Painel administrativo com autenticação JWT para gerenciar bolos, portfólio, blog, FAQs e pedidos.
- API REST com endpoints públicos e rotas protegidas para administração.
- Banco SQLite com seed automático e dados inspirados em uma confeitaria boutique (inclui usuário admin) e catálogo inicial de acessórios.

## 🏗️ Stack & dependências

| Camada        | Tecnologia                         |
| ------------- | ---------------------------------- |
| Frontend      | React + Vite, React Router, lucide-react, date-fns |
| Estilização   | CSS moderno com design system customizado |
| Backend       | Node.js 22, Express 5, CORS, bcryptjs, jsonwebtoken, Stripe |
| Banco de dados| SQLite (via sqlite3)               |

## 📂 Estrutura de pastas

```
Continue-ia/
├── client/              # Aplicação React (frontend)
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas e seções principais
│   │   ├── hooks/       # Hooks compartilhados
│   │   └── services/    # Cliente HTTP e integrações
│   └── public/
└── server/              # API Express + SQLite
    ├── src/
    │   ├── app.js       # Servidor Express e rotas
    │   ├── db.js        # Conexão e schema do SQLite
    │   └── seed.js      # Popular dados iniciais
    └── data/            # Arquivo boutique.db (gerado após seed)
```

## 🚀 Como executar

### 1. Backend (API + Banco)

```bash
cd server
npm install
npm run seed      # cria/atualiza banco boutique.db com dados exemplo
npm run dev       # inicia API em http://localhost:4000
```

Crie um arquivo `.env` (ou copie `.env.example`) para definir a `JWT_SECRET` utilizada na geração dos tokens:

```
JWT_SECRET=uma-chave-muito-segura
PORT=4000
STRIPE_SECRET_KEY=sua-chave-secreta-stripe
```

> Para aceitar pagamentos, cadastre uma chave secreta da Stripe. Opcionalmente configure webhooks (endpoint `/api/checkout/session` gera pedidos com status `pending`).

#### Endpoints principais

- `GET /api/health` — status da API
- `GET /api/categories` — categorias e contagem de produtos
- `GET /api/products?category=slug&featured=true` — catálogo filtrado
- `GET /api/products/:slug` — detalhes do produto + relacionados
- `POST /api/orders` — grava pedido/lead e retorna protocolo
- `GET /api/themes` — experiências temáticas com portfólio relacionado
- `GET /api/gallery` — peças do portfólio (aceita `?featured=true`)
- `GET /api/testimonials` — depoimentos
- `GET /api/faqs` — perguntas frequentes
- `GET /api/blog` e `GET /api/blog?slug=` — conteúdos do blog

> A API já está preparada para servir a versão buildada do frontend (pasta `client/dist`) em produção.

### 2. Frontend (Vite + React)

```bash
cd client
npm install
cp .env.example .env.local   # ajustar URL se precisar
npm run dev                  # http://localhost:5173
```

- `VITE_API_URL` padrão aponta para `http://localhost:4000`.
- Para build de produção: `npm run build` (saída em `client/dist`).
- Opcional: `npm run preview` para validar o build localmente.

## 🔐 Painel administrativo

- URL: `http://localhost:5173/admin`
- Credenciais seedadas: **admin@atelieaurora.com.br** / **AtelierAurora@2024**
- Funcionalidades:
  - Dashboard com métricas rápidas e últimos pedidos.
  - CRUD de produtos, categorias, temas e itens de portfólio.
  - Gestão de blog posts e FAQs.
  - Consulta detalhada de pedidos com preferências dos clientes.

> O token JWT é armazenado em `localStorage` e enviado automaticamente em todas as rotas protegidas (`/api/admin/*`).

## 🗂️ Banco de dados

O script `server/src/seed.js` cria as seguintes tabelas:

- `categories`, `products`
- `accessory_categories`, `accessories`, `accessory_orders`
- `themes`, `gallery_items`
- `testimonials`
- `faqs`
- `orders`, `order_items`
- `blog_posts`

Todos os relacionamentos utilizam chave estrangeira, com deleção em cascata quando aplicável.

## ✅ Testes rápidos

- `server`: `npm run seed` seguido de `npm run dev` (endpoints respondem em JSON). Teste rápido: `curl http://localhost:4000/api/health`.
- `client`: `npm run build` para garantir ausência de erros e gerar assets estáticos.

## 🔜 Próximos passos sugeridos

1. **Integração com serviço de e-mail/CRM** para automatizar follow-up dos pedidos.
2. **Webhook Stripe** para atualizar status das encomendas após pagamento confirmado.
3. **Upload de mídias** via Cloudinary/S3 e gerenciamento direto no painel.
4. **Testes automatizados** (Jest/RTL no frontend, supertest no backend).
5. **Controle de permissões** com diferentes perfis (ex.: marketing, produção) e internacionalização.

---

Projeto entregue pronto para demonstração comercial, com identidade visual coerente com o universo de confeitaria boutique e foco na jornada do usuário.
