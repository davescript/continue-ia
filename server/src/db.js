const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '../data');
const dbPath = path.join(dataDir, 'boutique.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      hero_image TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      sku TEXT,
      stock_units INTEGER DEFAULT 0,
      servings_min INTEGER,
      servings_max INTEGER,
      production_time TEXT,
      image_url TEXT,
      featured INTEGER DEFAULT 0,
      custom_options TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )`);

    db.run(
      `ALTER TABLE products ADD COLUMN sku TEXT`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna sku:', err.message);
        }
      }
    );

    db.run(
      `ALTER TABLE products ADD COLUMN stock_units INTEGER DEFAULT 0`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna stock_units:', err.message);
        }
      }
    );

    db.run(`CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color_palette TEXT,
      image_url TEXT,
      trend_score INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      theme_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      event_type TEXT,
      palette TEXT,
      featured INTEGER DEFAULT 0,
      FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      event_type TEXT,
      feedback TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      highlight TEXT,
      event_date TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      protocol TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      event_type TEXT,
      event_date TEXT,
      guest_count INTEGER,
      venue TEXT,
      budget_range TEXT,
      style_preferences TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      quantity INTEGER DEFAULT 1,
      customization TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT,
      author TEXT,
      published_at TEXT,
      reading_time INTEGER,
      image_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accessory_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      hero_image TEXT,
      position INTEGER DEFAULT 0
    )`);

    db.run(
      `ALTER TABLE accessory_categories ADD COLUMN description TEXT`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna description em accessory_categories:', err.message);
        }
      }
    );

    db.run(
      `ALTER TABLE accessory_categories ADD COLUMN hero_image TEXT`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna hero_image em accessory_categories:', err.message);
        }
      }
    );

    db.run(
      `ALTER TABLE accessory_categories ADD COLUMN position INTEGER DEFAULT 0`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna position em accessory_categories:', err.message);
        }
      }
    );

    db.run(`CREATE TABLE IF NOT EXISTS accessories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock_units INTEGER DEFAULT 0,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES accessory_categories(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS accessory_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stripe_session_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      customer_email TEXT,
      total_amount REAL DEFAULT 0,
      items_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(
      `ALTER TABLE pages ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna status em pages:', err.message);
        }
      }
    );

    db.run(
      `ALTER TABLE pages ADD COLUMN published_at TEXT`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna published_at em pages:', err.message);
        }
      }
    );

    db.run(
      `ALTER TABLE pages ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`,
      (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna updated_at em pages:', err.message);
        }
      }
    );

    db.run(`CREATE TABLE IF NOT EXISTS page_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      settings TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS page_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      props TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES page_sections(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS page_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    )`);
  });
};

module.exports = {
  db,
  initializeDatabase,
};
