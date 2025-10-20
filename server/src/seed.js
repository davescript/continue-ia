const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('./db');

const log = (message) => console.log(`[seed] ${message}`);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function callback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const seed = async () => {
  initializeDatabase();

  const tables = [
    // Páginas dinâmicas (filhos primeiro)
    'page_components',
    'page_sections',
    'page_versions',
    'pages',
    'order_items',
    'orders',
    'accessory_orders',
    'accessories',
    'accessory_categories',
    'products',
    'categories',
    'gallery_items',
    'themes',
    'testimonials',
    'faqs',
    'blog_posts',
    'users',
  ];

  log('Cleaning existing data...');
  for (const table of tables) {
    await run(`DELETE FROM ${table}`);
  }
  await run(
    `DELETE FROM sqlite_sequence WHERE name IN (${tables
      .map(() => '?')
      .join(', ')})`,
    tables
  ).catch(() => {
    // sqlite_sequence may not exist (e.g., older SQLite builds); ignore silently
  });

  log('Inserting admin user...');
  const adminPassword = await bcrypt.hash('LeiaSabores@2025', 10);
  await run(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name=excluded.name,
       password_hash=excluded.password_hash,
       role=excluded.role`,
    ['Equipe Leia Sabores', 'admin@leiasabores.pt', adminPassword, 'admin']
  );
  log('Admin user: admin@leiasabores.pt / LeiaSabores@2025');

  log('Inserting categories...');
  const categories = [
    {
      key: 'bolos-artisticos',
      name: 'Bolos Artísticos',
      description:
        'Criações únicas feitas sob medida, com recheios exclusivos e decoração artesanal.',
      hero_image:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    },
    {
      key: 'doces-finos',
      name: 'Doces Finos',
      description:
        'Bombons, brigadeiros gourmet e sobremesas individuais que encantam ao primeiro olhar.',
      hero_image:
        'https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      key: 'decoracao-de-festas',
      name: 'Decoração de Festas',
      description:
        'Projetos completos de ambientação com identidade visual alinhada ao seu evento.',
      hero_image:
        'https://images.unsplash.com/photo-1520759011454-5d8a96c0d0c0?auto=format&fit=crop&w=1200&q=80',
    },
    {
      key: 'kits-celebracao',
      name: 'Kits Celebração',
      description:
        'Combinações prontas de bolos, doces e ambientação para pequenas comemorações.',
      hero_image:
        'https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const categoryMap = {};
  for (const category of categories) {
    const result = await run(
      `INSERT INTO categories (name, slug, description, hero_image) VALUES (?, ?, ?, ?)`,
      [category.name, category.key, category.description, category.hero_image]
    );
    categoryMap[category.key] = result.lastID;
  }

  log('Inserting products...');
  const products = [
    {
      key: 'bolo-signature-floral',
      categoryKey: 'bolos-artisticos',
      name: 'Bolo Signature Floral',
      description:
        'Camadas de massa de baunilha com recheios de framboesa e creme brûlée. Decorado com flores naturais preservadas e pintura artística comestível.',
      price: 79.9,
      sku: 'PRD-001',
      stock_units: 15,
      servings_min: 20,
      servings_max: 35,
      production_time: '7 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80',
      featured: 1,
      custom_options: {
        flavors: ['Baunilha Bourbon', 'Red Velvet', 'Limão Siciliano', 'Chocolate Belga'],
        fillings: [
          'Ganache de Chocolate Ruby',
          'Creme de Pistache',
          'Brigadeiro de Doce de Leite',
          'Frutas Vermelhas com Champagne',
        ],
        finishes: ['Textura aveludada', 'Espatulado artístico', 'Aquarela comestível'],
      },
    },
    {
      key: 'bolo-esculpido-couture',
      categoryKey: 'bolos-artisticos',
      name: 'Bolo Esculpido Couture',
      description:
        'Design autoral com inspiração em alta costura. Camadas de cacau intenso, caramelo salgado e praliné de avelãs, finalizado com aplicação em pasta de açúcar.',
      price: 119.9,
      sku: 'PRD-002',
      stock_units: 8,
      servings_min: 30,
      servings_max: 50,
      production_time: '10 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=1200&q=80',
      featured: 1,
      custom_options: {
        flavors: ['Chocolate 70%', 'Nozes com Canela', 'Cenoura & Especiarias'],
        fillings: ['Caramelo Salgado', 'Geleia de Frutas Silvestres', 'Praliné de Avelãs'],
        finishes: ['Esculpido 3D', 'Aplicações em wafer paper', 'Detalhes metálicos'],
      },
    },
    {
      key: 'selecao-gourmand',
      categoryKey: 'doces-finos',
      name: 'Seleção Gourmand',
      description:
        'Caixa com 36 doces finos autorais, combinando sabores contemporâneos e texturas contrastantes.',
      price: 49.9,
      sku: 'PRD-003',
      stock_units: 20,
      servings_min: 12,
      servings_max: 18,
      production_time: '3 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1514516345957-556ca7d90a21?auto=format&fit=crop&w=1200&q=80',
      featured: 0,
      custom_options: {
        flavors: [
          'Trufa de Pistache & Flor de Sal',
          'Crocante de Avelã & Gianduia',
          'Pavlova de Maracujá',
          'Tartelete de Limão com Merengue',
        ],
        presentation: ['Prata espelhada', 'Caixas exclusivas em linho'],
      },
    },
    {
      key: 'mini-verrines-degustacao',
      categoryKey: 'doces-finos',
      name: 'Mini Verrines Degustação',
      description:
        'Coleção com 30 verrines harmonizadas com base de biscuit crocante e texturas cremosas.',
      price: 39.9,
      sku: 'PRD-004',
      stock_units: 12,
      servings_min: 15,
      servings_max: 25,
      production_time: '4 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1517620424844-6c0b5629f2d5?auto=format&fit=crop&w=1200&q=80',
      featured: 0,
      custom_options: {
        flavors: [
          'Cheesecake de Frutas Silvestres',
          'Tiramisu de Pistache',
          'Mousse de Coco & Cumaru',
        ],
        add_ons: ['Mini colheres em ouro velho', 'Aplicações com monograma'],
      },
    },
    {
      key: 'ambientacao-jardim-encantado',
      categoryKey: 'decoracao-de-festas',
      name: 'Ambientação Jardim Encantado',
      description:
        'Projeto completo de ambientação com folhagens naturais, arranjos florais, painel autoral e iluminação cênica.',
      price: 590,
      sku: 'PRD-005',
      stock_units: 4,
      servings_min: 50,
      servings_max: 120,
      production_time: '14 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1523395243481-163f8f6155d8?auto=format&fit=crop&w=1200&q=80',
      featured: 1,
      custom_options: {
        inclusions: [
          'Mesa de doces completa',
          'Backdrop personalizado',
          'Projeto floral',
          'Iluminação',
        ],
        upgrades: ['Lounge boho', 'Experiência sensorial com aromas', 'Cenografia suspensa'],
      },
    },
    {
      key: 'experiencia-noite-dourada',
      categoryKey: 'decoracao-de-festas',
      name: 'Experiência Noite Dourada',
      description:
        'Cenografia sofisticada com elementos reflexivos, velas em diferentes alturas e composição floral dramática.',
      price: 720,
      sku: 'PRD-006',
      stock_units: 3,
      servings_min: 80,
      servings_max: 180,
      production_time: '20 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
      featured: 0,
      custom_options: {
        inclusions: [
          'Painel central com textura metalizada',
          'Arranjos florais assinados',
          'Iluminação cênica',
        ],
        upgrades: ['Bar de drinks autorais', 'Cortina de luzes', 'Perfume ambiente exclusivo'],
      },
    },
    {
      key: 'mini-wedding-boutique',
      categoryKey: 'kits-celebracao',
      name: 'Mini Wedding Boutique',
      description:
        'Kit completo para celebrações intimistas com bolo de dois andares, mini doces e ambientação minimalista.',
      price: 199,
      sku: 'PRD-007',
      stock_units: 7,
      servings_min: 30,
      servings_max: 45,
      production_time: '7 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1511288597420-9243d0beaee8?auto=format&fit=crop&w=1200&q=80',
      featured: 1,
      custom_options: {
        includes: [
          'Bolo principal',
          '24 doces finos',
          '6 verrines',
          'Ambientação com flores sazonais',
        ],
        upgrades: ['Mini estação de café', 'Caixa de lembranças aromáticas'],
      },
    },
    {
      key: 'celebracao-kids-premium',
      categoryKey: 'kits-celebracao',
      name: 'Celebração Kids Premium',
      description:
        'Combo personalizado com bolo temático, cupcakes, pirulitos decorados e cenário instagramável.',
      price: 159,
      sku: 'PRD-008',
      stock_units: 6,
      servings_min: 20,
      servings_max: 35,
      production_time: '10 dias úteis',
      image_url:
        'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
      featured: 0,
      custom_options: {
        includes: [
          'Bolo temático 2 andares',
          '20 cupcakes decorados',
          'Painel ilustrado',
          'Kit de lembranças',
        ],
        upgrades: ['Oficina criativa', 'Cabine fotográfica', 'Personagens ao vivo'],
      },
    },
  ];

  for (const product of products) {
    await run(
      `INSERT INTO products (
        category_id,
        name,
        slug,
        description,
        price,
        sku,
        stock_units,
        servings_min,
        servings_max,
        production_time,
        image_url,
        featured,
        custom_options
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoryMap[product.categoryKey],
        product.name,
        product.key,
        product.description,
        product.price,
        product.sku || null,
        product.stock_units ?? 0,
        product.servings_min,
        product.servings_max,
        product.production_time,
        product.image_url,
        product.featured,
        JSON.stringify(product.custom_options),
      ]
    );
  }

  const productRows = await all(`SELECT id, slug FROM products`);
  const productMapBySlug = {};
  productRows.forEach((row) => {
    productMapBySlug[row.slug] = row.id;
  });

  log('Inserting accessory categories...');
  const accessoryCategories = [
    {
      slug: 'novidades',
      name: 'Novidades',
      description: 'Lançamentos e coleções recém-chegadas para surpreender cada convidado.',
      hero_image: '/homem-aranha.jpg',
      position: 1,
    },
    {
      slug: 'temas-para-festas',
      name: 'Temas para Festas',
      description: 'Cenários completos por temática, com kits coordenados prontos para montar.',
      hero_image: '/lilo-stitch.jpg',
      position: 2,
    },
    {
      slug: 'baloes',
      name: 'Balões',
      description: 'Balões metalizados, cromados e orgânicos com acessórios para arcos e painéis.',
      hero_image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      position: 3,
    },
    {
      slug: 'mesa-de-festa',
      name: 'Mesa de Festa',
      description: 'Pratos, copos, guardanapos e talheres premium para mesas memoráveis.',
      hero_image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
      position: 4,
    },
    {
      slug: 'acessorios-para-bolos',
      name: 'Acessórios para Bolos',
      description: 'Topos, bases, velas especiais e detalhes que transformam o bolo em destaque.',
      hero_image:
        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
      position: 5,
    },
    {
      slug: 'decoracao',
      name: 'Decoração',
      description: 'Painéis, guirlandas, iluminação e objetos decorativos para cada estilo.',
      hero_image:
        'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=900&q=80',
      position: 6,
    },
    {
      slug: 'acessorios',
      name: 'Acessórios',
      description: 'Detalhes que completam o styling: cake stands, suportes e peças utilitárias.',
      hero_image:
        'https://images.unsplash.com/photo-1544784201-6de89fb4e554?auto=format&fit=crop&w=900&q=80',
      position: 7,
    },
    {
      slug: 'cores',
      name: 'Cores',
      description: 'Coleções organizadas por paletas para facilitar a escolha da combinação perfeita.',
      hero_image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
      position: 8,
    },
    {
      slug: 'pinturas',
      name: 'Pinturas',
      description: 'Tints e materiais para pintura de rosto, corpo e props cenográficos.',
      hero_image:
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
      position: 9,
    },
    {
      slug: 'ocasioes',
      name: 'Ocasiões',
      description: 'Seleções especiais para aniversários, batizados, casamentos e corporate.',
      hero_image:
        'https://images.unsplash.com/photo-1571731956672-64321289fcc3?auto=format&fit=crop&w=900&q=80',
      position: 10,
    },
    {
      slug: 'festas-sazonais',
      name: 'Festas Sazonais',
      description: 'Coleções temáticas para Natal, Páscoa, Halloween e outras datas marcantes.',
      hero_image:
        'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=900&q=80',
      position: 11,
    },
    {
      slug: 'prendas-brindes',
      name: 'Prendas e Brindes',
      description: 'Lembranças personalizadas, brindes corporativos e detalhes para agradecer convidados.',
      hero_image:
        'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=900&q=80',
      position: 12,
    },
  ];

  for (const category of accessoryCategories) {
    await run(
      `INSERT INTO accessory_categories (name, slug, description, hero_image, position)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET
         name=excluded.name,
         description=excluded.description,
         hero_image=excluded.hero_image,
         position=excluded.position`,
      [category.name, category.slug, category.description, category.hero_image, category.position]
    );
  }

  const accessoryCategoryMap = {};
  const accessoryCategoryRows = await all(`SELECT id, slug FROM accessory_categories`);
  accessoryCategoryRows.forEach((row) => {
    accessoryCategoryMap[row.slug] = row.id;
  });

  log('Inserting accessories...');
  const accessories = [
    {
      category_slug: 'novidades',
      name: 'Kit Festa Holográfica',
      slug: 'kit-festa-holografica',
      description:
        'Combinação com backdrop holográfico, balões cromados e toppers iridescentes para lançamentos do mês.',
      price: 249.9,
      stock_units: 14,
      image_url: '/homem-aranha.jpg',
    },
    {
      category_slug: 'temas-para-festas',
      name: 'Cenário Safari Aventura',
      slug: 'cenario-safari-aventura',
      description:
        'Painel ilustrado, kit de folhas tropicais, pelúcias decorativas e acessórios de mesa no tema safari.',
      price: 189.0,
      stock_units: 10,
      image_url: '/lilo-stitch.jpg',
    },
    {
      category_slug: 'baloes',
      name: 'Balões Metalizados Aurora 80pç',
      slug: 'baloes-metalizados-aurora',
      description:
        'Seleção de 80 balões metalizados e matte com bomba manual e fita para criar arco orgânico.',
      price: 79.9,
      stock_units: 32,
      image_url:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'mesa-de-festa',
      name: 'Mesa Posta Terracota 24pç',
      slug: 'mesa-posta-terracota',
      description:
        'Jogo com pratos descartáveis rígidos, copos, guardanapos e talheres em tons terracota e nude.',
      price: 64.5,
      stock_units: 24,
      image_url:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'acessorios-para-bolos',
      name: 'Topo de Bolo Glitter Personalizável',
      slug: 'topo-bolo-glitter-personalizavel',
      description:
        'Topo em acrílico espelhado com camada de glitter e opção de personalizar nome e idade.',
      price: 34.9,
      stock_units: 45,
      image_url:
        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'decoracao',
      name: 'Guirlanda de Luzes Warm 10m',
      slug: 'guirlanda-luzes-warm',
      description:
        'Fio de led quente com 10 metros, bivolt, ideal para molduras de painéis e mesas principais.',
      price: 52.0,
      stock_units: 28,
      image_url:
        'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'acessorios',
      name: 'Suporte para Doces Mármore',
      slug: 'suporte-doces-marmore',
      description:
        'Cake stand baixo com base em mármore branco e detalhes em dourado fosco.',
      price: 112.0,
      stock_units: 16,
      image_url:
        'https://images.unsplash.com/photo-1544784201-6de89fb4e554?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'cores',
      name: 'Kit Paleta Lavanda & Dourado',
      slug: 'kit-paleta-lavanda-dourado',
      description:
        'Pacote com balões, toalha, toppers e velas em lavanda com detalhes dourados.',
      price: 119.0,
      stock_units: 18,
      image_url:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'pinturas',
      name: 'Kit Pintura Facial Kids',
      slug: 'kit-pintura-facial-kids',
      description:
        'Tinta dermatologicamente testada, pincéis e moldes temáticos para pintura de rosto.',
      price: 44.9,
      stock_units: 30,
      image_url:
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'ocasioes',
      name: 'Kit Batizado Elegance',
      slug: 'kit-batizado-elegance',
      description:
        'Conjunto com vela, livro de mensagens, lembranças em organza e mini terço decorativo.',
      price: 89.5,
      stock_units: 22,
      image_url:
        'https://images.unsplash.com/photo-1571731956672-64321289fcc3?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'festas-sazonais',
      name: 'Kit Halloween Neon',
      slug: 'kit-halloween-neon',
      description:
        'Decoração fluorescente com painel, balões, toppers e adesivos para festas temáticas de outubro.',
      price: 135.0,
      stock_units: 15,
      image_url:
        'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1200&q=80',
    },
    {
      category_slug: 'prendas-brindes',
      name: 'Mini Vela Aromática Agradecimento',
      slug: 'mini-vela-agradecimento',
      description:
        'Vela em lata dourada com essência de flor de laranjeira e etiqueta personalizável.',
      price: 24.0,
      stock_units: 48,
      image_url:
        'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  for (const accessory of accessories) {
    const categoryId = accessoryCategoryMap[accessory.category_slug];
    if (!categoryId) {
      log(`Skipping accessory "${accessory.name}" - missing category ${accessory.category_slug}`);
      continue;
    }
    await run(
      `INSERT INTO accessories (category_id, name, slug, description, price, stock_units, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [
        categoryId,
        accessory.name,
        accessory.slug,
        accessory.description,
        accessory.price,
        accessory.stock_units,
        accessory.image_url,
      ]
    );
  }

  log('Inserting sample orders...');
  const ordersData = [
    {
      protocol: 'AA-2024-0001',
      customer_name: 'Mariana Souza',
      email: 'mariana.souza@email.com',
      phone: '(11) 98877-1122',
      event_type: 'Mini Wedding',
      event_date: '2024-11-23',
      guest_count: 48,
      venue: 'Casa Jardim Aurora',
      budget_range: 'R$ 8 mil a R$ 12 mil',
      style_preferences: ['romântico', 'botânico'],
      notes: 'Preferência por flores naturais preservadas e paleta com tons pastel.',
      items: [
        { slug: 'bolo-signature-floral', quantity: 1 },
        { slug: 'selecao-gourmand', quantity: 2 },
      ],
    },
    {
      protocol: 'AA-2024-0002',
      customer_name: 'Thiago Martins',
      email: 'thiago.martins@email.com',
      phone: '(21) 99741-5588',
      event_type: 'Aniversário 40 anos',
      event_date: '2024-12-04',
      guest_count: 65,
      venue: 'Espaço Galeria Leste',
      budget_range: 'R$ 12 mil a R$ 18 mil',
      style_preferences: ['noturno', 'metálico'],
      notes: 'Incluir experiência de iluminação e mesa de doces com tons azul e dourado.',
      items: [
        { slug: 'experiencia-noite-dourada', quantity: 1 },
        { slug: 'mini-verrines-degustacao', quantity: 3 },
      ],
    },
    {
      protocol: 'AA-2024-0003',
      customer_name: 'Carla Ribeiro',
      email: 'carla.ribeiro@email.com',
      phone: '(31) 99121-3344',
      event_type: 'Chá revelação',
      event_date: '2025-01-18',
      guest_count: 35,
      venue: 'Residência Família Ribeiro',
      budget_range: 'R$ 4 mil a R$ 6 mil',
      style_preferences: ['delicado', 'tons candy'],
      notes: 'Mesa instagramável e bolo com acabamento aquarelado.',
      items: [
        { slug: 'mini-wedding-boutique', quantity: 1 },
        { slug: 'celebracao-kids-premium', quantity: 1 },
      ],
    },
  ];

  for (const order of ordersData) {
    const orderResult = await run(
      `INSERT INTO orders (
        protocol,
        customer_name,
        email,
        phone,
        event_type,
        event_date,
        guest_count,
        venue,
        budget_range,
        style_preferences,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.protocol,
        order.customer_name,
        order.email,
        order.phone,
        order.event_type,
        order.event_date,
        order.guest_count,
        order.venue,
        order.budget_range,
        JSON.stringify(order.style_preferences),
        order.notes,
      ]
    );

    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const productId = productMapBySlug[item.slug] || null;
        await run(
          `INSERT INTO order_items (order_id, product_id, quantity, customization)
           VALUES (?, ?, ?, ?)`,
          [
            orderResult.lastID,
            productId,
            item.quantity || 1,
            item.customization ? JSON.stringify(item.customization) : null,
          ]
        );
      }
    }
  }

  log('Inserting themes and gallery...');
  const themes = [
    {
      key: 'jardim-secreto',
      name: 'Jardim Secreto',
      description:
        'Paleta em tons de verde, nude e rosa quartz com elementos botânicos e iluminação acolhedora.',
      color_palette: ['#9FB9A3', '#F3D8E6', '#F9F5F0', '#4B644A'],
      image_url:
        'https://images.unsplash.com/photo-1524638431109-93d95c968f03?auto=format&fit=crop&w=1200&q=80',
      trend_score: 95,
    },
    {
      key: 'noite-estelar',
      name: 'Noite Estelar',
      description:
        'Composição moderna em tons galácticos, com detalhes metalizados e luzes pontuais.',
      color_palette: ['#1C1B29', '#3C4976', '#F6C667', '#EDF2F9'],
      image_url:
        'https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=1200&q=80',
      trend_score: 88,
    },
    {
      key: 'brunch-provençal',
      name: 'Brunch Provençal',
      description:
        'Ambiente leve com inspiração francesa, tons pastel e elementos em linho natural.',
      color_palette: ['#F2E8DF', '#D8C3A5', '#8E9AAF', '#EFD3D7'],
      image_url:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
      trend_score: 82,
    },
  ];

  const themeMap = {};
  for (const theme of themes) {
    const result = await run(
      `INSERT INTO themes (name, description, color_palette, image_url, trend_score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        theme.name,
        theme.description,
        JSON.stringify(theme.color_palette),
        theme.image_url,
        theme.trend_score,
      ]
    );
    themeMap[theme.key] = result.lastID;
  }

  const galleryItems = [
    {
      themeKey: 'jardim-secreto',
      title: 'Casamento no Jardim Botanique',
      description:
        'Mesa central com bolo de quatro andares, arranjos assimétricos e delicada chuva de luzes.',
      image_url:
        'https://images.unsplash.com/photo-1464349161435-7aa472148238?auto=format&fit=crop&w=1200&q=80',
      event_type: 'Casamento',
      palette: 'Verde sálvia, champagne, rosé, dourado antigo',
      featured: 1,
    },
    {
      themeKey: 'jardim-secreto',
      title: 'Chá Revelação Aurora',
      description:
        'Composição aérea com pendentes florais, bolo aquarelado e estação de sobremesas à francesa.',
      image_url:
        'https://images.unsplash.com/photo-1542042178-3c6c84f5b626?auto=format&fit=crop&w=1200&q=80',
      event_type: 'Chá Revelação',
      palette: 'Lavanda, buttercream, verde oliva',
      featured: 0,
    },
    {
      themeKey: 'noite-estelar',
      title: 'Aniversário Noite Estelar',
      description:
        'Painel em veludo azul profundo, bolo com acabamento galáctico e instalações de luzes integradas.',
      image_url:
        'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=1200&q=80',
      event_type: 'Aniversário Adulto',
      palette: 'Azul profundo, grafite, dourado, prata',
      featured: 1,
    },
    {
      themeKey: 'brunch-provençal',
      title: 'Brunch Romântico',
      description:
        'Mesa posta com peças em cerâmica artesanal, bolo texturizado e arranjos em tons pastel.',
      image_url:
        'https://images.unsplash.com/photo-1519985176271-adb1088fa94c?auto=format&fit=crop&w=1200&q=80',
      event_type: 'Mini Wedding',
      palette: 'Rosa chá, creme, verde seco, dourado rosé',
      featured: 0,
    },
  ];

  for (const item of galleryItems) {
    await run(
      `INSERT INTO gallery_items (theme_id, title, description, image_url, event_type, palette, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        themeMap[item.themeKey],
        item.title,
        item.description,
        item.image_url,
        item.event_type,
        item.palette,
        item.featured,
      ]
    );
  }

  log('Inserting testimonials...');
  const testimonials = [
    {
      client_name: 'Mariana & Tiago',
      event_type: 'Mini Wedding',
      feedback:
        'O bolo era uma escultura comestível e a ambientação superou todas as nossas expectativas. A equipe captou nossa essência e traduziu em cada detalhe.',
      rating: 5,
      highlight: 'Design autoral e execução impecável',
      event_date: '2024-03-16',
    },
    {
      client_name: 'Helena Martins',
      event_type: 'Aniversário 40 anos',
      feedback:
        'A experiência foi completa: cardápio harmonizado, doces surpreendentes e uma cenografia que deixou todos os convidados encantados.',
      rating: 5,
      highlight: 'Experiência multisensorial',
      event_date: '2024-05-10',
    },
    {
      client_name: 'Eduarda & Família',
      event_type: 'Chá Revelação',
      feedback:
        'Tudo foi cuidadosamente pensado, desde o bolo aquarelado até as lembranças personalizadas. Nos sentimos acolhidos em cada interação.',
      rating: 5,
      highlight: 'Atendimento humano e criativo',
      event_date: '2024-02-04',
    },
  ];

  for (const testimonial of testimonials) {
    await run(
      `INSERT INTO testimonials (client_name, event_type, feedback, rating, highlight, event_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        testimonial.client_name,
        testimonial.event_type,
        testimonial.feedback,
        testimonial.rating,
        testimonial.highlight,
        testimonial.event_date,
      ]
    );
  }

  log('Inserting FAQs...');
  const faqs = [
    {
      category: 'Pedidos',
      question: 'Qual o prazo ideal para solicitar um bolo personalizado?',
      answer:
        'Para garantir o desenvolvimento artístico e a reserva na agenda, recomendamos o contato com 30 dias de antecedência para bolos exclusivos e 15 dias para kits celebração.',
    },
    {
      category: 'Entrega',
      question: 'Vocês atendem eventos fora da região metropolitana?',
      answer:
        'Sim, realizamos eventos em todo o estado. A logística é planejada caso a caso, com transporte climatizado e equipe técnica especializada.',
    },
    {
      category: 'Personalização',
      question: 'É possível criar um projeto digital antes da produção?',
      answer:
        'Oferecemos apresentação de conceito visual com moodboard, paleta de cores e mockups 3D mediante contratação do projeto criativo, que é abatido do valor final.',
    },
    {
      category: 'Dietas Especiais',
      question: 'Vocês trabalham com restrições alimentares?',
      answer:
        'Desenvolvemos receitas especiais sem glúten, lactose ou açúcares refinados mediante consulta prévia. A produção ocorre em cozinha separada e segue rígidos protocolos de segurança.',
    },
    {
      category: 'Eventos Corporativos',
      question: 'Como funciona a personalização para eventos corporativos?',
      answer:
        'Criamos projetos alinhados ao branding da marca, com opções de ativações sensoriais, brindes personalizados e relatórios pós-evento. Atendemos desde lançamentos até confraternizações.',
    },
  ];

  for (const faq of faqs) {
    await run(
      `INSERT INTO faqs (category, question, answer) VALUES (?, ?, ?)`,
      [faq.category, faq.question, faq.answer]
    );
  }

  log('Inserting blog posts...');
  const blogPosts = [
    {
      title: 'Tendências em Mesa de Doces para 2025',
      slug: 'tendencias-mesa-de-doces-2025',
      excerpt:
        'Texturas, formas orgânicas e experiências multissensoriais que vão transformar o seu evento.',
      content:
        'As mesas de doces evoluíram para instalações artísticas, que combinam gastronomia, design e experiência. Aposte em alturas variadas, suportes autorais e iluminação cênica para valorizar cada criação. Elementos botânicos, perfis metálicos e peças em cerâmica artesanal estão em alta.',
      author: 'Equipe Atelier Aurora',
      published_at: '2024-06-18',
      reading_time: 5,
      image_url:
        'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Como definir o bolo ideal para o seu evento',
      slug: 'como-definir-o-bolo-ideal',
      excerpt:
        'Traduza a personalidade da celebração em camadas de sabor, estética e storytelling.',
      content:
        'O ponto de partida é compreender a narrativa do evento: estilo, paleta de cores e referências afetivas. A partir disso, desenhamos um projeto exclusivo que considera sabores, texturas e técnicas decorativas. Bolos elevados com estruturas internas permitem formatos esculturais e garantem estabilidade durante o evento.',
      author: 'Chef Ana Luiza',
      published_at: '2024-04-12',
      reading_time: 6,
      image_url:
        'https://images.unsplash.com/photo-1470123808288-1e59739a8da4?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Ambientação sensorial: o diferencial das festas autorais',
      slug: 'ambientacao-sensorial-diferencial',
      excerpt:
        'Como integrar aroma, iluminação e paisagismo para criar memórias inesquecíveis.',
      content:
        'Na decoração de festas, cada elemento conta uma história. Trabalhar com camadas de iluminação, fragrâncias exclusivas e texturas naturais gera uma atmosfera acolhedora e memorável. Explore elementos em alturas diferentes, peças artesanais e detalhes personalizados para envolver os convidados.',
      author: 'Atelier Aurora',
      published_at: '2024-05-27',
      reading_time: 7,
      image_url:
        'https://images.unsplash.com/photo-1524624819823-1f13a6b32162?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  for (const post of blogPosts) {
    await run(
      `INSERT INTO blog_posts (title, slug, excerpt, content, author, published_at, reading_time, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        post.title,
        post.slug,
        post.excerpt,
        post.content,
        post.author,
        post.published_at,
        post.reading_time,
        post.image_url,
      ]
    );
  }

  // Dynamic page example
  log('Inserting dynamic page example...');
  const pageTitle = 'Página Exemplo';
  const pageSlug = 'pagina-exemplo';
  const pageResult = await run(
    `INSERT INTO pages (title, slug, status, published_at)
     VALUES (?, ?, 'published', ?)
     ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title,
       status=excluded.status,
       published_at=excluded.published_at`,
    [pageTitle, pageSlug, new Date().toISOString()]
  );

  // Fetch page id (in case of update)
  const pageRow = await all(`SELECT id FROM pages WHERE slug = ?`, [pageSlug]);
  const pageId = pageRow?.[0]?.id || pageResult.lastID;

  // Clean previous sections/components for this page
  await run(`DELETE FROM page_components WHERE section_id IN (SELECT id FROM page_sections WHERE page_id = ?)`, [pageId]);
  await run(`DELETE FROM page_sections WHERE page_id = ?`, [pageId]);

  // Section 1: hero
  const heroSettings = {
    backgroundImage:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=80',
    overlay: true,
    layout: 'hero',
    align: 'center',
    paddingTop: '4rem',
    paddingBottom: '4rem',
    fullWidth: true,
  };
  const heroSection = await run(
    `INSERT INTO page_sections (page_id, type, position, settings)
     VALUES (?, ?, ?, ?)` ,
    [pageId, 'hero', 1, JSON.stringify(heroSettings)]
  );

  await run(
    `INSERT INTO page_components (section_id, type, position, props)
     VALUES (?, 'heading', 1, ?)` ,
    [heroSection.lastID, JSON.stringify({ text: 'Coleções em Destaque', level: 1 })]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props)
     VALUES (?, 'text', 2, ?)` ,
    [
      heroSection.lastID,
      JSON.stringify({ text: 'Inspire-se com cenários prontos e personalizáveis para o seu evento.' }),
    ]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props)
     VALUES (?, 'button', 3, ?)` ,
    [heroSection.lastID, JSON.stringify({ label: 'Explorar Catálogo', to: '/acessorios', variant: 'primary' })]
  );

  // Section 2: product grid
  const gridSettings = { type: 'grid', layout: 'grid', columns: 2, align: 'left' };
  const gridSection = await run(
    `INSERT INTO page_sections (page_id, type, position, settings)
     VALUES (?, ?, ?, ?)` ,
    [pageId, 'grid', 2, JSON.stringify(gridSettings)]
  );

  await run(
    `INSERT INTO page_components (section_id, type, position, props)
     VALUES (?, 'product-grid', 1, ?)` ,
    [gridSection.lastID, JSON.stringify({ heading: 'Novidades', category: 'novidades', limit: 4 })]
  );

  // Home editorial page
  log('Inserting dynamic page: Home Editorial...');
  const homeTitle = 'Home Editorial';
  const homeSlug = 'home-editorial';
  const homeUpsert = await run(
    `INSERT INTO pages (title, slug, status, published_at)
     VALUES (?, ?, 'published', ?)
     ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title,
       status=excluded.status,
       published_at=excluded.published_at`,
    [homeTitle, homeSlug, new Date().toISOString()]
  );
  const homeRow = await all(`SELECT id FROM pages WHERE slug = ?`, [homeSlug]);
  const homeId = homeRow?.[0]?.id || homeUpsert.lastID;
  await run(`DELETE FROM page_components WHERE section_id IN (SELECT id FROM page_sections WHERE page_id = ?)`, [homeId]);
  await run(`DELETE FROM page_sections WHERE page_id = ?`, [homeId]);
  const homeHeroSettings = {
    layout: 'hero',
    align: 'left',
    overlay: true,
    fullWidth: true,
    backgroundImage:
      'https://images.unsplash.com/photo-1523395243481-163f8f6155d8?auto=format&fit=crop&w=1600&q=80',
  };
  const homeHero = await run(
    `INSERT INTO page_sections (page_id, type, position, settings) VALUES (?, 'hero', 1, ?)`,
    [homeId, JSON.stringify(homeHeroSettings)]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'hero-cta', 1, ?)`,
    [
      homeHero.lastID,
      JSON.stringify({
        title: 'Curadoria para festas autorais',
        subtitle: 'Kits, décor e experiências para eventos inesquecíveis.',
        actions: [
          { label: 'Explorar catálogo', to: '/acessorios' },
          { label: 'Coleção destaque', to: '/destaque', variant: 'ghost' },
        ],
      }),
    ]
  );
  const homeGrid = await run(
    `INSERT INTO page_sections (page_id, type, position, settings) VALUES (?, 'grid', 2, ?)`,
    [homeId, JSON.stringify({ layout: 'grid', columns: 3, align: 'left' })]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'product-grid', 1, ?)`,
    [homeGrid.lastID, JSON.stringify({ heading: 'Mais pedidos', limit: 6 })]
  );
  const homeStack = await run(
    `INSERT INTO page_sections (page_id, type, position, settings) VALUES (?, 'stack', 3, ?)`,
    [homeId, JSON.stringify({ layout: 'stack', align: 'center', paddingTop: '2rem', paddingBottom: '2rem' })]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'rich-text', 1, ?)`,
    [
      homeStack.lastID,
      JSON.stringify({ html: '<p>Produção artesanal, prazos alinhados e atendimento dedicado.</p>' }),
    ]
  );

  // Landing page
  log('Inserting dynamic page: Landing Festas...');
  const landTitle = 'Landing Festas';
  const landSlug = 'landing-festas';
  const landUpsert = await run(
    `INSERT INTO pages (title, slug, status, published_at)
     VALUES (?, ?, 'published', ?)
     ON CONFLICT(slug) DO UPDATE SET
       title=excluded.title,
       status=excluded.status,
       published_at=excluded.published_at`,
    [landTitle, landSlug, new Date().toISOString()]
  );
  const landRow = await all(`SELECT id FROM pages WHERE slug = ?`, [landSlug]);
  const landId = landRow?.[0]?.id || landUpsert.lastID;
  await run(`DELETE FROM page_components WHERE section_id IN (SELECT id FROM page_sections WHERE page_id = ?)`, [landId]);
  await run(`DELETE FROM page_sections WHERE page_id = ?`, [landId]);
  const landHero = await run(
    `INSERT INTO page_sections (page_id, type, position, settings) VALUES (?, 'hero', 1, ?)`,
    [
      landId,
      JSON.stringify({
        layout: 'hero',
        align: 'center',
        overlay: true,
        fullWidth: true,
        backgroundImage:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
      }),
    ]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'heading', 1, ?)`,
    [landHero.lastID, JSON.stringify({ text: 'Monte a sua festa agora', level: 1 })]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'text', 2, ?)`,
    [
      landHero.lastID,
      JSON.stringify({ text: 'Escolha um tema, personalize o carrinho e receba com agilidade.' }),
    ]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'button', 3, ?)`,
    [landHero.lastID, JSON.stringify({ label: 'Ver catálogo', to: '/acessorios' })]
  );
  const landGrid = await run(
    `INSERT INTO page_sections (page_id, type, position, settings) VALUES (?, 'grid', 2, ?)`,
    [landId, JSON.stringify({ layout: 'grid', columns: 2, align: 'left' })]
  );
  await run(
    `INSERT INTO page_components (section_id, type, position, props) VALUES (?, 'product-grid', 1, ?)`,
    [landGrid.lastID, JSON.stringify({ heading: 'Kits recomendados', category: 'temas-para-festas', limit: 4 })]
  );

  log('Seed completed successfully.');
};

seed()
  .catch((error) => {
    console.error('[seed] Erro ao executar seed:', error);
  })
  .finally(() => {
    db.close();
  });
