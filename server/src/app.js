const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const { db, initializeDatabase } = require('./db');

const app = express();
const STARTED_AT = new Date();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'atelier-aurora-dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || null;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

initializeDatabase();

app.use(cors());
app.use(express.json());

const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const mapProduct = (product) => ({
  ...product,
  price: Number(product.price),
  servings_min: product.servings_min ? Number(product.servings_min) : null,
  servings_max: product.servings_max ? Number(product.servings_max) : null,
  featured: Boolean(product.featured),
  stock_units:
    product.stock_units === null || product.stock_units === undefined
      ? 0
      : Number(product.stock_units),
  sku: product.sku || null,
  custom_options: product.custom_options ? JSON.parse(product.custom_options) : null,
});

const mapAccessory = (accessory) => ({
  ...accessory,
  price: Number(accessory.price),
  stock_units:
    accessory.stock_units === null || accessory.stock_units === undefined
      ? 0
      : Number(accessory.stock_units),
});

const sanitizeUser = (user) =>
  user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      }
    : null;

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
  }

  const token = authHeader.replace('Bearer', '').trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await dbGet(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
      [payload.sub]
    );

    if (!user) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
};

const slugify = (value = '') => {
  return (
    value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-') || `item-${Date.now()}`
  );
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableInteger = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toJSONColumn = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {
      return JSON.stringify(trimmed);
    }
  }
  return JSON.stringify(value);
};

const parseBooleanFlag = (value) =>
  value === true || value === 1 || value === '1' || value === 'true';

const parseJSONColumn = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  } catch {
    return fallback;
  }
};

const reorderEntities = async ({ table, parentColumn, parentId, entityId, direction }) => {
  const rows = await dbAll(
    `SELECT id, position FROM ${table} WHERE ${parentColumn} = ? ORDER BY position ASC, id ASC`,
    [parentId]
  );

  const currentIndex = rows.findIndex((row) => row.id === Number(entityId));
  if (currentIndex < 0) {
    return;
  }

  let targetIndex = currentIndex;
  if (direction === 'up') {
    targetIndex = Math.max(currentIndex - 1, 0);
  } else if (direction === 'down') {
    targetIndex = Math.min(currentIndex + 1, rows.length - 1);
  } else if (Number.isFinite(direction)) {
    targetIndex = Math.min(Math.max(0, Number(direction)), rows.length - 1);
  }

  if (targetIndex === currentIndex) {
    return;
  }

  const reordered = [...rows];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);

  for (let index = 0; index < reordered.length; index += 1) {
    const row = reordered[index];
    await dbRun(`UPDATE ${table} SET position = ? WHERE id = ?`, [index + 1, row.id]);
  }
};

const mapComponentRow = (row) => ({
  id: row.id,
  section_id: row.section_id,
  type: row.type,
  position: row.position,
  props: parseJSONColumn(row.props, {}),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapSectionRow = (row) => ({
  id: row.id,
  page_id: row.page_id,
  type: row.type,
  position: row.position,
  settings: parseJSONColumn(row.settings, {}),
  created_at: row.created_at,
  updated_at: row.updated_at,
  components: [],
});

const mapPageRow = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  status: row.status,
  published_at: row.published_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildPageStructure = async (pageRow) => {
  if (!pageRow) return null;

  const sections = await dbAll(
    `SELECT * FROM page_sections WHERE page_id = ? ORDER BY position ASC, id ASC`,
    [pageRow.id]
  );

  if (!sections.length) {
    return { ...mapPageRow(pageRow), sections: [] };
  }

  const sectionIds = sections.map((section) => section.id);
  const inClause = sectionIds.map(() => '?').join(', ');

  const components = await dbAll(
    `SELECT * FROM page_components WHERE section_id IN (${inClause}) ORDER BY position ASC, id ASC`,
    sectionIds
  );

  const sectionMap = {};
  sections.forEach((section) => {
    sectionMap[section.id] = mapSectionRow(section);
  });

  components.forEach((component) => {
    const mapped = mapComponentRow(component);
    if (sectionMap[mapped.section_id]) {
      sectionMap[mapped.section_id].components.push(mapped);
    }
  });

  return {
    ...mapPageRow(pageRow),
    sections: sections.map((section) => sectionMap[section.id]),
  };
};

const buildPageSnapshot = async (pageId) => {
  const pageRow = await dbGet(`SELECT * FROM pages WHERE id = ?`, [pageId]);
  return buildPageStructure(pageRow);
};

const applyPageSnapshot = async (pageId, snapshot) => {
  if (!snapshot || !Array.isArray(snapshot.sections)) {
    await dbRun(`DELETE FROM page_sections WHERE page_id = ?`, [pageId]);
    return;
  }

  await dbRun(`DELETE FROM page_sections WHERE page_id = ?`, [pageId]);

  for (const section of snapshot.sections) {
    const sectionResult = await dbRun(
      `INSERT INTO page_sections (page_id, type, position, settings)
       VALUES (?, ?, ?, ?)`,
      [
        pageId,
        section.type || 'stack',
        section.position ?? 0,
        toJSONColumn(section.settings),
      ]
    );

    const sectionId = sectionResult.lastID;
    if (Array.isArray(section.components)) {
      for (const component of section.components) {
        await dbRun(
          `INSERT INTO page_components (section_id, type, position, props)
           VALUES (?, ?, ?, ?)`,
          [
            sectionId,
            component.type || 'text',
            component.position ?? 0,
            toJSONColumn(component.props),
          ]
        );
      }
    }
  }
};

const adminRouter = express.Router();
adminRouter.use(requireAuth);

adminRouter.get('/summary', async (_req, res) => {
  try {
    const [productsRow, ordersRow, clientsRow, revenueRow, lowStockRow] = await Promise.all([
      dbGet(`SELECT COUNT(*) AS total FROM products`),
      dbGet(`SELECT COUNT(*) AS total FROM orders`),
      dbGet(`SELECT COUNT(DISTINCT email) AS total FROM orders`),
      dbGet(
        `SELECT SUM(COALESCE(p.price, 0) * COALESCE(oi.quantity, 1)) AS total
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id`
      ),
      dbGet(`SELECT COUNT(*) AS total FROM products WHERE stock_units IS NOT NULL AND stock_units <= 5`),
    ]);

    res.json({
      totalProducts: productsRow?.total ? Number(productsRow.total) : 0,
      totalOrders: ordersRow?.total ? Number(ordersRow.total) : 0,
      totalClients: clientsRow?.total ? Number(clientsRow.total) : 0,
      totalRevenue: revenueRow?.total ? Number(revenueRow.total) : 0,
      lowStockCount: lowStockRow?.total ? Number(lowStockRow.total) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar resumo.' });
  }
});

adminRouter.get('/pages', async (_req, res) => {
  try {
    const pages = await dbAll(`SELECT * FROM pages ORDER BY updated_at DESC`);
    res.json(pages.map(mapPageRow));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar páginas.' });
  }
});

adminRouter.post('/pages', async (req, res) => {
  const { title, slug, status = 'draft', published_at: publishedAt } = req.body || {};
  if (!title) {
    return res.status(422).json({ error: 'Informe o título da página.' });
  }
  const pageSlug = (slug || slugify(title)).toLowerCase();
  const normalizedStatus = ['draft', 'published'].includes(status) ? status : 'draft';
  const publishedValue =
    normalizedStatus === 'published'
      ? publishedAt || new Date().toISOString()
      : null;

  try {
    const result = await dbRun(
      `INSERT INTO pages (title, slug, status, published_at)
       VALUES (?, ?, ?, ?)`,
      [title, pageSlug, normalizedStatus, publishedValue]
    );
    const page = await dbGet(`SELECT * FROM pages WHERE id = ?`, [result.lastID]);
    const payload = await buildPageStructure(page);
    res.status(201).json(payload);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma página com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível criar a página.' });
  }
});

adminRouter.get('/pages/:id', async (req, res) => {
  try {
    const page = await dbGet(`SELECT * FROM pages WHERE id = ?`, [req.params.id]);
    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }
    const payload = await buildPageStructure(page);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar a página.' });
  }
});

adminRouter.put('/pages/:id', async (req, res) => {
  const { title, slug, status, published_at: publishedAt } = req.body || {};
  try {
    const current = await dbGet(`SELECT * FROM pages WHERE id = ?`, [req.params.id]);
    if (!current) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }

    const nextTitle = title || current.title;
    const nextSlug = (slug || current.slug || slugify(nextTitle)).toLowerCase();
    const nextStatus = ['draft', 'published'].includes(status)
      ? status
      : current.status;
    let nextPublishedAt = current.published_at;
    if (nextStatus === 'published') {
      nextPublishedAt = publishedAt || current.published_at || new Date().toISOString();
    } else {
      nextPublishedAt = null;
    }

    await dbRun(
      `UPDATE pages
       SET title = ?, slug = ?, status = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextTitle, nextSlug, nextStatus, nextPublishedAt, req.params.id]
    );

    const page = await dbGet(`SELECT * FROM pages WHERE id = ?`, [req.params.id]);
    const payload = await buildPageStructure(page);
    res.json(payload);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma página com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar a página.' });
  }
});

adminRouter.delete('/pages/:id', async (req, res) => {
  try {
    const page = await dbGet(`SELECT * FROM pages WHERE id = ?`, [req.params.id]);
    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }
    await dbRun(`DELETE FROM pages WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível remover a página.' });
  }
});

adminRouter.get('/pages/:id/versions', async (req, res) => {
  try {
    const versions = await dbAll(
      `SELECT id, page_id, comment, created_at FROM page_versions WHERE page_id = ? ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar versões.' });
  }
});

adminRouter.post('/pages/:id/versions', async (req, res) => {
  const { comment } = req.body || {};
  try {
    const snapshot = await buildPageSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }
    const result = await dbRun(
      `INSERT INTO page_versions (page_id, snapshot, comment) VALUES (?, ?, ?)`,
      [req.params.id, JSON.stringify(snapshot), comment || null]
    );
    const version = await dbGet(
      `SELECT id, page_id, comment, created_at FROM page_versions WHERE id = ?`,
      [result.lastID]
    );
    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar a versão.' });
  }
});

adminRouter.delete('/pages/:id/versions/:versionId', async (req, res) => {
  try {
    await dbRun(`DELETE FROM page_versions WHERE id = ? AND page_id = ?`, [
      req.params.versionId,
      req.params.id,
    ]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível remover a versão.' });
  }
});

adminRouter.post('/pages/:id/versions/:versionId/restore', async (req, res) => {
  try {
    const version = await dbGet(
      `SELECT * FROM page_versions WHERE id = ? AND page_id = ?`,
      [req.params.versionId, req.params.id]
    );
    if (!version) {
      return res.status(404).json({ error: 'Versão não encontrada.' });
    }
    const snapshot = parseJSONColumn(version.snapshot, null);
    await applyPageSnapshot(req.params.id, snapshot || { sections: [] });
    const payload = await buildPageSnapshot(req.params.id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível restaurar a versão.' });
  }
});

adminRouter.post('/pages/:id/sections', async (req, res) => {
  const { type, settings, position } = req.body || {};
  if (!type) {
    return res.status(422).json({ error: 'Informe o tipo da seção.' });
  }

  try {
    const page = await dbGet(`SELECT * FROM pages WHERE id = ?`, [req.params.id]);
    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }

    let nextPosition = toNullableInteger(position);
    if (nextPosition === null) {
      const maxRow = await dbGet(
        `SELECT MAX(position) AS max FROM page_sections WHERE page_id = ?`,
        [req.params.id]
      );
      const currentMax = maxRow && maxRow.max !== null ? Number(maxRow.max) : null;
      nextPosition = Number.isFinite(currentMax) ? currentMax + 1 : 1;
    }

    const result = await dbRun(
      `INSERT INTO page_sections (page_id, type, position, settings)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, type, nextPosition, toJSONColumn(settings)]
    );

    const section = await dbGet(`SELECT * FROM page_sections WHERE id = ?`, [result.lastID]);
    res.status(201).json(mapSectionRow(section));
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar a seção.' });
  }
});

adminRouter.put('/pages/:id/sections/:sectionId', async (req, res) => {
  const { type, settings, position } = req.body || {};
  try {
    const section = await dbGet(
      `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
      [req.params.sectionId, req.params.id]
    );
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada.' });
    }

    const nextType = type || section.type;
    const nextSettings =
      settings !== undefined ? toJSONColumn(settings) : section.settings;
    const parsedPosition =
      position !== undefined ? toNullableInteger(position) : null;
    const nextPosition = parsedPosition !== null ? parsedPosition : section.position;

    await dbRun(
      `UPDATE page_sections
       SET type = ?, position = ?, settings = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextType, nextPosition, nextSettings, req.params.sectionId]
    );

    const updated = await dbGet(`SELECT * FROM page_sections WHERE id = ?`, [req.params.sectionId]);
    res.json(mapSectionRow(updated));
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível atualizar a seção.' });
  }
});

adminRouter.delete('/pages/:id/sections/:sectionId', async (req, res) => {
  try {
    const section = await dbGet(
      `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
      [req.params.sectionId, req.params.id]
    );
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada.' });
    }
    await dbRun(`DELETE FROM page_sections WHERE id = ?`, [req.params.sectionId]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível remover a seção.' });
  }
});

adminRouter.post('/pages/:id/sections/:sectionId/reorder', async (req, res) => {
  const { direction } = req.body || {};
  try {
    const section = await dbGet(
      `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
      [req.params.sectionId, req.params.id]
    );
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada.' });
    }
    await reorderEntities({
      table: 'page_sections',
      parentColumn: 'page_id',
      parentId: req.params.id,
      entityId: req.params.sectionId,
      direction,
    });
    const payload = await buildPageSnapshot(req.params.id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível reordenar a seção.' });
  }
});

adminRouter.post('/pages/:id/sections/:sectionId/components', async (req, res) => {
  const { type, props, position } = req.body || {};
  if (!type) {
    return res.status(422).json({ error: 'Informe o tipo do componente.' });
  }

  try {
    const section = await dbGet(
      `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
      [req.params.sectionId, req.params.id]
    );
    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada.' });
    }

    let nextPosition = toNullableInteger(position);
    if (nextPosition === null) {
      const maxRow = await dbGet(
        `SELECT MAX(position) AS max FROM page_components WHERE section_id = ?`,
        [req.params.sectionId]
      );
      const currentMax = maxRow && maxRow.max !== null ? Number(maxRow.max) : null;
      nextPosition = Number.isFinite(currentMax) ? currentMax + 1 : 1;
    }

    const result = await dbRun(
      `INSERT INTO page_components (section_id, type, position, props)
       VALUES (?, ?, ?, ?)`,
      [req.params.sectionId, type, nextPosition, toJSONColumn(props)]
    );

    const component = await dbGet(`SELECT * FROM page_components WHERE id = ?`, [
      result.lastID,
    ]);
    res.status(201).json(mapComponentRow(component));
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar o componente.' });
  }
});

adminRouter.put(
  '/pages/:id/sections/:sectionId/components/:componentId',
  async (req, res) => {
    const { type, props, position } = req.body || {};

    try {
      const section = await dbGet(
        `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
        [req.params.sectionId, req.params.id]
      );
      if (!section) {
        return res.status(404).json({ error: 'Seção não encontrada.' });
      }

      const component = await dbGet(
        `SELECT * FROM page_components WHERE id = ? AND section_id = ?`,
        [req.params.componentId, req.params.sectionId]
      );
      if (!component) {
        return res.status(404).json({ error: 'Componente não encontrado.' });
      }

      const nextType = type || component.type;
      const nextProps = props !== undefined ? toJSONColumn(props) : component.props;
      const parsedPosition =
        position !== undefined ? toNullableInteger(position) : null;
      const nextPosition = parsedPosition !== null ? parsedPosition : component.position;

      await dbRun(
        `UPDATE page_components
         SET type = ?, position = ?, props = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nextType, nextPosition, nextProps, req.params.componentId]
      );

      const updated = await dbGet(`SELECT * FROM page_components WHERE id = ?`, [
        req.params.componentId,
      ]);
      res.json(mapComponentRow(updated));
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível atualizar o componente.' });
    }
  }
);

adminRouter.delete(
  '/pages/:id/sections/:sectionId/components/:componentId',
  async (req, res) => {
    try {
      const component = await dbGet(
        `SELECT * FROM page_components WHERE id = ? AND section_id = ?`,
        [req.params.componentId, req.params.sectionId]
      );

      if (!component) {
        return res.status(404).json({ error: 'Componente não encontrado.' });
      }

      await dbRun(`DELETE FROM page_components WHERE id = ?`, [req.params.componentId]);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível remover o componente.' });
    }
  }
);

adminRouter.post(
  '/pages/:id/sections/:sectionId/components/:componentId/reorder',
  async (req, res) => {
    const { direction } = req.body || {};
    try {
      const section = await dbGet(
        `SELECT * FROM page_sections WHERE id = ? AND page_id = ?`,
        [req.params.sectionId, req.params.id]
      );
      if (!section) {
        return res.status(404).json({ error: 'Seção não encontrada.' });
      }

      const component = await dbGet(
        `SELECT * FROM page_components WHERE id = ? AND section_id = ?`,
        [req.params.componentId, req.params.sectionId]
      );
      if (!component) {
        return res.status(404).json({ error: 'Componente não encontrado.' });
      }

      await reorderEntities({
        table: 'page_components',
        parentColumn: 'section_id',
        parentId: req.params.sectionId,
        entityId: req.params.componentId,
        direction,
      });

      const payload = await buildPageSnapshot(req.params.id);
      res.json(payload);
    } catch (error) {
      res.status(500).json({ error: 'Não foi possível reordenar o componente.' });
    }
  }
);

adminRouter.get('/categories', async (_req, res) => {
  try {
    const categories = await dbAll(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

adminRouter.post('/categories', async (req, res) => {
  const { name, slug, description, hero_image } = req.body || {};

  if (!name) {
    return res.status(422).json({ error: 'Informe o nome da categoria.' });
  }

  const categorySlug = (slug || slugify(name)).toLowerCase();

  try {
    const result = await dbRun(
      `INSERT INTO categories (name, slug, description, hero_image)
       VALUES (?, ?, ?, ?)`,
      [name, categorySlug, description || null, hero_image || null]
    );
    const category = await dbGet(`SELECT * FROM categories WHERE id = ?`, [result.lastID]);
    res.status(201).json(category);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma categoria com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível criar a categoria.' });
  }
});

adminRouter.put('/categories/:id', async (req, res) => {
  const { name, slug, description, hero_image } = req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM categories WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const updatedSlug = (slug || existing.slug || slugify(name || existing.name)).toLowerCase();

    await dbRun(
      `UPDATE categories
       SET name = ?, slug = ?, description = ?, hero_image = ?
       WHERE id = ?`,
      [
        name || existing.name,
        updatedSlug,
        description ?? existing.description,
        hero_image ?? existing.hero_image,
        id,
      ]
    );

    const category = await dbGet(`SELECT * FROM categories WHERE id = ?`, [id]);
    res.json(category);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma categoria com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar a categoria.' });
  }
});

adminRouter.delete('/categories/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir a categoria.' });
  }
});

adminRouter.get('/products', async (_req, res) => {
  try {
    const rows = await dbAll(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows.map(mapProduct));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

adminRouter.post('/products', async (req, res) => {
  const {
    category_id,
    category_slug,
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
    custom_options,
  } = req.body || {};

  if (!name) {
    return res.status(422).json({ error: 'Informe o nome do produto.' });
  }

  if (price === undefined || price === null || price === '') {
    return res.status(422).json({ error: 'Informe o preço base do produto.' });
  }

  let categoryId = category_id;
  if (!categoryId && category_slug) {
    const category = await dbGet(`SELECT id FROM categories WHERE slug = ?`, [category_slug]);
    if (!category) {
      return res.status(422).json({ error: 'Categoria informada não encontrada.' });
    }
    categoryId = category.id;
  }

  if (!categoryId) {
    return res.status(422).json({ error: 'Selecione uma categoria válida.' });
  }

  const productSlug = (slug || slugify(name)).toLowerCase();
  const stockUnits =
    stock_units === undefined || stock_units === null || stock_units === ''
      ? 0
      : Number(stock_units);

  try {
    const result = await dbRun(
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
        categoryId,
        name,
        productSlug,
        description || null,
        Number(price),
        sku || null,
        stockUnits,
        toNullableInteger(servings_min),
        toNullableInteger(servings_max),
        production_time || null,
        image_url || null,
        parseBooleanFlag(featured) ? 1 : 0,
        toJSONColumn(custom_options),
      ]
    );

    const product = await dbGet(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [result.lastID]
    );

    res.status(201).json(mapProduct(product));
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe um produto com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível criar o produto.' });
  }
});

adminRouter.put('/products/:id', async (req, res) => {
  const {
    category_id,
    category_slug,
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
    custom_options,
  } = req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM products WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    let categoryId = category_id ?? existing.category_id;
    if (!categoryId && category_slug) {
      const category = await dbGet(`SELECT id FROM categories WHERE slug = ?`, [category_slug]);
      if (!category) {
        return res.status(422).json({ error: 'Categoria informada não encontrada.' });
      }
      categoryId = category.id;
    }

    const updatedSlug = (slug || existing.slug || slugify(name || existing.name)).toLowerCase();
    const stockUnits =
      stock_units === undefined || stock_units === null || stock_units === ''
        ? existing.stock_units ?? 0
        : Number(stock_units);

    await dbRun(
      `UPDATE products
       SET category_id = ?,
           name = ?,
           slug = ?,
           description = ?,
           price = ?,
           sku = ?,
           stock_units = ?,
           servings_min = ?,
           servings_max = ?,
           production_time = ?,
           image_url = ?,
           featured = ?,
           custom_options = ?
       WHERE id = ?`,
      [
        categoryId,
        name || existing.name,
        updatedSlug,
        description ?? existing.description,
        price !== undefined ? Number(price) : Number(existing.price),
        sku ?? existing.sku,
        stockUnits,
        toNullableInteger(servings_min ?? existing.servings_min),
        toNullableInteger(servings_max ?? existing.servings_max),
        production_time ?? existing.production_time,
        image_url ?? existing.image_url,
        parseBooleanFlag(
          featured !== undefined ? featured : existing.featured
        )
          ? 1
          : 0,
        custom_options !== undefined
          ? toJSONColumn(custom_options)
          : existing.custom_options,
        id,
      ]
    );

    const product = await dbGet(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    res.json(mapProduct(product));
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe um produto com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar o produto.' });
  }
});

adminRouter.delete('/products/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM products WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir o produto.' });
  }
});

adminRouter.get('/themes', async (_req, res) => {
  try {
    const themes = await dbAll(`SELECT * FROM themes ORDER BY trend_score DESC`);
    res.json(
      themes.map((theme) => ({
        ...theme,
        color_palette: theme.color_palette ? JSON.parse(theme.color_palette) : [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar temas.' });
  }
});

adminRouter.post('/themes', async (req, res) => {
  const { name, description, color_palette, image_url, trend_score } = req.body || {};

  if (!name) {
    return res.status(422).json({ error: 'Informe o nome do tema.' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO themes (name, description, color_palette, image_url, trend_score)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        toJSONColumn(color_palette),
        image_url || null,
        toNullableInteger(trend_score) ?? 0,
      ]
    );

    const theme = await dbGet(`SELECT * FROM themes WHERE id = ?`, [result.lastID]);
    res.status(201).json({
      ...theme,
      color_palette: theme.color_palette ? JSON.parse(theme.color_palette) : [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar o tema.' });
  }
});

adminRouter.put('/themes/:id', async (req, res) => {
  const { name, description, color_palette, image_url, trend_score } = req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM themes WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Tema não encontrado.' });
    }

    await dbRun(
      `UPDATE themes
       SET name = ?,
           description = ?,
           color_palette = ?,
           image_url = ?,
           trend_score = ?
       WHERE id = ?`,
      [
        name || existing.name,
        description ?? existing.description,
        color_palette !== undefined
          ? toJSONColumn(color_palette)
          : existing.color_palette,
        image_url ?? existing.image_url,
        toNullableInteger(trend_score ?? existing.trend_score),
        id,
      ]
    );

    const theme = await dbGet(`SELECT * FROM themes WHERE id = ?`, [id]);
    res.json({
      ...theme,
      color_palette: theme.color_palette ? JSON.parse(theme.color_palette) : [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível atualizar o tema.' });
  }
});

adminRouter.delete('/themes/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM themes WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir o tema.' });
  }
});

adminRouter.get('/gallery', async (_req, res) => {
  try {
    const items = await dbAll(
      `SELECT gi.*, t.name AS theme_name
       FROM gallery_items gi
       LEFT JOIN themes t ON gi.theme_id = t.id
       ORDER BY gi.featured DESC, gi.id DESC`
    );
    res.json(
      items.map((item) => ({
        ...item,
        featured: Boolean(item.featured),
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar portfólio.' });
  }
});

adminRouter.post('/gallery', async (req, res) => {
  const { theme_id, title, description, image_url, event_type, palette, featured } = req.body || {};

  if (!title || !image_url) {
    return res.status(422).json({ error: 'Título e imagem são obrigatórios.' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO gallery_items (theme_id, title, description, image_url, event_type, palette, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        theme_id || null,
        title,
        description || null,
        image_url,
        event_type || null,
        palette || null,
        parseBooleanFlag(featured) ? 1 : 0,
      ]
    );

    const item = await dbGet(
      `SELECT gi.*, t.name AS theme_name
       FROM gallery_items gi
       LEFT JOIN themes t ON gi.theme_id = t.id
       WHERE gi.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      ...item,
      featured: Boolean(item.featured),
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar o item do portfólio.' });
  }
});

adminRouter.put('/gallery/:id', async (req, res) => {
  const { theme_id, title, description, image_url, event_type, palette, featured } = req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM gallery_items WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Item do portfólio não encontrado.' });
    }

    await dbRun(
      `UPDATE gallery_items
       SET theme_id = ?,
           title = ?,
           description = ?,
           image_url = ?,
           event_type = ?,
           palette = ?,
           featured = ?
       WHERE id = ?`,
      [
        theme_id ?? existing.theme_id,
        title || existing.title,
        description ?? existing.description,
        image_url ?? existing.image_url,
        event_type ?? existing.event_type,
        palette ?? existing.palette,
        parseBooleanFlag(
          featured !== undefined ? featured : existing.featured
        )
          ? 1
          : 0,
        id,
      ]
    );

    const item = await dbGet(
      `SELECT gi.*, t.name AS theme_name
       FROM gallery_items gi
       LEFT JOIN themes t ON gi.theme_id = t.id
       WHERE gi.id = ?`,
      [id]
    );

    res.json({
      ...item,
      featured: Boolean(item.featured),
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível atualizar o item do portfólio.' });
  }
});

adminRouter.delete('/gallery/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM gallery_items WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir o item do portfólio.' });
  }
});

adminRouter.get('/blog', async (_req, res) => {
  try {
    const posts = await dbAll(`SELECT * FROM blog_posts ORDER BY published_at DESC`);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar publicações.' });
  }
});

adminRouter.post('/blog', async (req, res) => {
  const { title, slug, excerpt, content, author, published_at, reading_time, image_url } =
    req.body || {};

  if (!title || !content) {
    return res.status(422).json({ error: 'Título e conteúdo são obrigatórios.' });
  }

  const postSlug = (slug || slugify(title)).toLowerCase();

  try {
    const result = await dbRun(
      `INSERT INTO blog_posts (title, slug, excerpt, content, author, published_at, reading_time, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        postSlug,
        excerpt || null,
        content,
        author || 'Equipe Atelier Aurora',
        published_at || new Date().toISOString().slice(0, 10),
        toNullableInteger(reading_time) ?? 5,
        image_url || null,
      ]
    );

    const post = await dbGet(`SELECT * FROM blog_posts WHERE id = ?`, [result.lastID]);
    res.status(201).json(post);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma publicação com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível criar a publicação.' });
  }
});

adminRouter.put('/blog/:id', async (req, res) => {
  const { title, slug, excerpt, content, author, published_at, reading_time, image_url } =
    req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM blog_posts WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Publicação não encontrada.' });
    }

    const updatedSlug = (slug || existing.slug || slugify(title || existing.title)).toLowerCase();

    await dbRun(
      `UPDATE blog_posts
       SET title = ?,
           slug = ?,
           excerpt = ?,
           content = ?,
           author = ?,
           published_at = ?,
           reading_time = ?,
           image_url = ?
       WHERE id = ?`,
      [
        title || existing.title,
        updatedSlug,
        excerpt ?? existing.excerpt,
        content || existing.content,
        author ?? existing.author,
        published_at ?? existing.published_at,
        toNullableInteger(reading_time ?? existing.reading_time),
        image_url ?? existing.image_url,
        id,
      ]
    );

    const post = await dbGet(`SELECT * FROM blog_posts WHERE id = ?`, [id]);
    res.json(post);
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Já existe uma publicação com esse slug.' });
    }
    res.status(500).json({ error: 'Não foi possível atualizar a publicação.' });
  }
});

adminRouter.delete('/blog/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM blog_posts WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir a publicação.' });
  }
});

adminRouter.get('/faqs', async (_req, res) => {
  try {
    const faqs = await dbAll(`SELECT * FROM faqs ORDER BY category ASC, id ASC`);
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar FAQs.' });
  }
});

adminRouter.post('/faqs', async (req, res) => {
  const { category, question, answer } = req.body || {};

  if (!category || !question || !answer) {
    return res.status(422).json({ error: 'Preencha categoria, pergunta e resposta.' });
  }

  try {
    const result = await dbRun(
      `INSERT INTO faqs (category, question, answer) VALUES (?, ?, ?)`,
      [category, question, answer]
    );
    const faq = await dbGet(`SELECT * FROM faqs WHERE id = ?`, [result.lastID]);
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar a FAQ.' });
  }
});

adminRouter.put('/faqs/:id', async (req, res) => {
  const { category, question, answer } = req.body || {};
  const { id } = req.params;

  try {
    const existing = await dbGet(`SELECT * FROM faqs WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'FAQ não encontrada.' });
    }

    await dbRun(
      `UPDATE faqs SET category = ?, question = ?, answer = ? WHERE id = ?`,
      [
        category || existing.category,
        question || existing.question,
        answer || existing.answer,
        id,
      ]
    );

    const faq = await dbGet(`SELECT * FROM faqs WHERE id = ?`, [id]);
    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível atualizar a FAQ.' });
  }
});

adminRouter.delete('/faqs/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM faqs WHERE id = ?`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível excluir a FAQ.' });
  }
});

adminRouter.get('/orders', async (_req, res) => {
  try {
    const orders = await dbAll(`SELECT * FROM orders ORDER BY created_at DESC`);
    const items = await dbAll(
      `SELECT oi.*, p.price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id`
    );

    const grouped = orders.map((order) => ({
      ...order,
      style_preferences: order.style_preferences ? JSON.parse(order.style_preferences) : null,
      items: items
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          ...item,
          price: item.price ? Number(item.price) : null,
          customization: item.customization ? JSON.parse(item.customization) : null,
        })),
    }));

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pedidos.' });
  }
});

adminRouter.get('/orders/:id', async (req, res) => {
  try {
    const order = await dbGet(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const items = await dbAll(
      `SELECT oi.*, p.price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    res.json({
      ...order,
      style_preferences: order.style_preferences ? JSON.parse(order.style_preferences) : null,
      items: items.map((item) => ({
        ...item,
        price: item.price ? Number(item.price) : null,
        customization: item.customization ? JSON.parse(item.customization) : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar pedido.' });
  }
});

app.use('/api/admin', adminRouter);

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  try {
    const user = await dbGet(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível realizar login.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/health', (_, res) => {
  let version = null;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    version = require('../package.json').version || null;
  } catch (_) {
    version = null;
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    started_at: STARTED_AT.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version,
  });
});

app.head('/api/health', (_req, res) => {
  res.status(200).end();
});

app.get('/api/categories', async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

app.get('/api/products', async (req, res) => {
  const { category, featured } = req.query;
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }

  if (featured === 'true') {
    conditions.push('p.featured = 1');
  }

  let query = `
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY p.featured DESC, p.created_at DESC';

  try {
    const rows = await dbAll(query, params);
    res.json(rows.map(mapProduct));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const product = await dbGet(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const related = await dbAll(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE c.id = ? AND p.slug != ?
       ORDER BY p.featured DESC
       LIMIT 3`,
      [product.category_id, req.params.slug]
    );

    res.json({
      ...mapProduct(product),
      related: related.map(mapProduct),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar produto.' });
  }
});

app.get('/api/accessories/categories', async (_req, res) => {
  try {
    const rows = await dbAll(
      `SELECT ac.*, COUNT(a.id) AS item_count
       FROM accessory_categories ac
       LEFT JOIN accessories a ON a.category_id = ac.id
       GROUP BY ac.id
       ORDER BY ac.position ASC, ac.name ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar categorias de acessórios.' });
  }
});

app.get('/api/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  const preview = req.query.preview === 'true';

  try {
    const page = await dbGet(
      `SELECT * FROM pages WHERE slug = ? ${preview ? '' : "AND status = 'published'"}`,
      [slug]
    );

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada.' });
    }

    const payload = await buildPageStructure(page);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar a página.' });
  }
});

app.get('/api/accessories', async (req, res) => {
  const { category, limit } = req.query;
  const params = [];
  let query = `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
               FROM accessories a
               INNER JOIN accessory_categories ac ON a.category_id = ac.id`;

  if (category) {
    query += ' WHERE ac.slug = ?';
    params.push(category);
  }

  query += ' ORDER BY a.name';

  const parsedLimit = Number(limit);
  if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
    query += ' LIMIT ?';
    params.push(parsedLimit);
  }

  try {
    const rows = await dbAll(query, params);
    res.json(rows.map(mapAccessory));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar acessórios.' });
  }
});

app.get('/api/accessories/:slug', async (req, res) => {
  try {
    const accessory = await dbGet(
      `SELECT a.*, ac.name AS category_name, ac.slug AS category_slug
       FROM accessories a
       INNER JOIN accessory_categories ac ON a.category_id = ac.id
       WHERE a.slug = ?`,
      [req.params.slug]
    );

    if (!accessory) {
      return res.status(404).json({ error: 'Acessório não encontrado.' });
    }

    res.json(mapAccessory(accessory));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar acessório.' });
  }
});

app.post('/api/checkout/session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Pagamento indisponível: configure a STRIPE_SECRET_KEY.' });
  }

  const { items = [], successUrl, cancelUrl, customerEmail } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Informe os itens para pagamento.' });
  }

  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'URLs de sucesso e cancelamento são obrigatórias.' });
  }

  try {
    const ids = items.map((item) => Number(item.id)).filter(Boolean);
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Itens inválidos.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const accessories = await dbAll(
      `SELECT * FROM accessories WHERE id IN (${placeholders})`,
      ids
    );

    const accessoryMap = Object.fromEntries(accessories.map((acc) => [acc.id, acc]));

    const lineItems = [];
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const quantity = item.quantity ? Number(item.quantity) : 1;
      const accessory = accessoryMap[item.id];
      if (!accessory) {
        return res.status(404).json({ error: `Acessório ${item.id} não encontrado.` });
      }

      const unitAmount = Math.round(Number(accessory.price) * 100);
      totalAmount += Number(accessory.price) * quantity;

      lineItems.push({
        price_data: {
          currency: 'eur',
          unit_amount: unitAmount,
          product_data: {
            name: accessory.name,
            description: accessory.description || undefined,
            images: accessory.image_url ? [accessory.image_url] : undefined,
          },
        },
        quantity: quantity,
      });

      orderItems.push({
        id: accessory.id,
        name: accessory.name,
        price: Number(accessory.price),
        quantity,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        origin: 'atelier-aurora-accessories',
      },
    });

    await dbRun(
      `INSERT INTO accessory_orders (stripe_session_id, status, customer_email, total_amount, items_json)
       VALUES (?, ?, ?, ?, ?)` ,
      [
        session.id,
        'pending',
        customerEmail || null,
        totalAmount,
        JSON.stringify(orderItems),
      ]
    );

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error', error);
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento.' });
  }
});

app.get('/api/themes', async (_, res) => {
  try {
    const themes = await dbAll(`SELECT * FROM themes ORDER BY trend_score DESC`);
    const gallery = await dbAll(
      `SELECT gi.*, t.name as theme_name
       FROM gallery_items gi
       LEFT JOIN themes t ON gi.theme_id = t.id
       ORDER BY gi.featured DESC, gi.id DESC`
    );

    const grouped = themes.map((theme) => ({
      ...theme,
      color_palette: theme.color_palette ? JSON.parse(theme.color_palette) : [],
      relatedGallery: gallery
        .filter((item) => item.theme_id === theme.id)
        .map((item) => ({
          ...item,
          featured: Boolean(item.featured),
        })),
    }));

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar temas.' });
  }
});

app.get('/api/gallery', async (req, res) => {
  const featuredOnly = req.query.featured === 'true';
  try {
    const items = await dbAll(
      `SELECT gi.*, t.name as theme_name, t.color_palette
       FROM gallery_items gi
       LEFT JOIN themes t ON gi.theme_id = t.id
       ${featuredOnly ? 'WHERE gi.featured = 1' : ''}
       ORDER BY gi.featured DESC, gi.id DESC`
    );

    res.json(
      items.map((item) => ({
        ...item,
        featured: Boolean(item.featured),
        color_palette: item.color_palette ? JSON.parse(item.color_palette) : [],
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar portfólio.' });
  }
});

app.get('/api/testimonials', async (_, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM testimonials ORDER BY event_date DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar depoimentos.' });
  }
});

app.get('/api/faqs', async (_, res) => {
  try {
    const rows = await dbAll(
      `SELECT * FROM faqs ORDER BY category ASC, id ASC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar FAQs.' });
  }
});

app.get('/api/blog', async (req, res) => {
  const { slug } = req.query;
  try {
    if (slug) {
      const post = await dbGet(`SELECT * FROM blog_posts WHERE slug = ?`, [slug]);
      if (!post) {
        return res.status(404).json({ error: 'Publicação não encontrada.' });
      }
      return res.json(post);
    }

    const posts = await dbAll(
      `SELECT id, title, slug, excerpt, author, published_at, reading_time, image_url
       FROM blog_posts
       ORDER BY published_at DESC`
    );
    return res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar publicações.' });
  }
});

const generateProtocol = () => {
  const now = new Date();
  const year = now.getFullYear();
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `AA-${year}-${random}`;
};

app.post('/api/orders', async (req, res) => {
  const {
    customer = {},
    event = {},
    preferences = {},
    items = [],
  } = req.body || {};

  if (!customer.name || !customer.email) {
    return res.status(422).json({
      error: 'Nome e e-mail são obrigatórios para registrar o pedido.',
    });
  }

  const protocol = generateProtocol();

  try {
    const orderResult = await dbRun(
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
        protocol,
        customer.name,
        customer.email,
        customer.phone || null,
        event.type || null,
        event.date || null,
        event.guests || null,
        event.venue || null,
        preferences.budget || null,
        preferences.style ? JSON.stringify(preferences.style) : null,
        preferences.notes || null,
      ]
    );

    if (items && items.length > 0) {
      const stmt = db.prepare(
        `INSERT INTO order_items (order_id, product_id, quantity, customization)
         VALUES (?, ?, ?, ?)`
      );
      items.forEach((item) => {
        stmt.run(
          orderResult.lastID,
          item.productId || null,
          item.quantity || 1,
          item.customization ? JSON.stringify(item.customization) : null
        );
      });
      stmt.finalize();
    }

    res.status(201).json({
      protocol,
      message:
        'Pedido registrado com sucesso! Em breve nossa equipe entrará em contato para finalizar os detalhes.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível registrar o pedido.' });
  }
});

const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(
    express.static(clientDistPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    })
  );
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
