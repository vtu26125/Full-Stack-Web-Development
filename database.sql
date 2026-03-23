-- Electronics Inventory Control & Stock Tracking System
-- Schema: tables created automatically on server startup

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  account_type VARCHAR(50) NOT NULL,
  balance NUMERIC(12, 2) DEFAULT 0,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
  UNIQUE (supplier_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  to_account INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  reference_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  min_stock INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL;

INSERT INTO customers (name) VALUES
  ('Walk-in Customer'),
  ('John Smith'),
  ('Maria Garcia'),
  ('Alex Chen'),
  ('Priya Sharma'),
  ('David Brown')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  product_type_id INTEGER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  UNIQUE (name, product_type_id)
);

CREATE TABLE IF NOT EXISTS configurations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  product_type_id INTEGER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  UNIQUE (name, product_type_id)
);

CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  product_type_id INTEGER NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  UNIQUE (name, product_type_id)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS type_id INTEGER REFERENCES product_types(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_id INTEGER REFERENCES models(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE models ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE product_types DROP COLUMN IF EXISTS description;
ALTER TABLE product_types DROP COLUMN IF EXISTS created_at;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_config_id_fkey;
ALTER TABLE products ADD COLUMN IF NOT EXISTS config_id INTEGER;
UPDATE products SET config_id = NULL;
ALTER TABLE products ADD CONSTRAINT products_config_id_fkey FOREIGN KEY (config_id) REFERENCES configurations(id) ON DELETE SET NULL;

INSERT INTO product_types (name) VALUES
  ('Monitor'),
  ('Keyboard'),
  ('Laptop'),
  ('Printer')
ON CONFLICT (name) DO NOTHING;

INSERT INTO models (name, product_type_id)
SELECT 'P2419H', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT '27GL850', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'S24R350', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'VG279Q', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT '24MP88HV', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'K120', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'BlackWidow V3', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'K70 RGB', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT '250 G4', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'MK270', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'XPS 15', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'Pavilion 15', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'ThinkPad X1 Carbon', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'ZenBook 14', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'Aspire 5', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'DeskJet 3755', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'PIXMA G3010', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'EcoTank L3250', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'HL-L2350DW', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO models (name, product_type_id)
SELECT 'MFC-L2750DW', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;

INSERT INTO brands (name, product_type_id)
SELECT 'Dell', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'LG', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Samsung', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'ASUS', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Logitech', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Razer', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Corsair', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'HP', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Dell', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'HP', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Lenovo', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'ASUS', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Acer', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'HP', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Canon', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Epson', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO brands (name, product_type_id)
SELECT 'Brother', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;

-- Link laptop models to their brands (for Brand → Model filtering)
UPDATE models m SET brand_id = b.id FROM brands b, product_types pt
WHERE m.product_type_id = pt.id AND pt.name = 'Laptop' AND m.name = 'XPS 15' AND b.product_type_id = pt.id AND b.name = 'Dell';
UPDATE models m SET brand_id = b.id FROM brands b, product_types pt
WHERE m.product_type_id = pt.id AND pt.name = 'Laptop' AND m.name = 'Pavilion 15' AND b.product_type_id = pt.id AND b.name = 'HP';
UPDATE models m SET brand_id = b.id FROM brands b, product_types pt
WHERE m.product_type_id = pt.id AND pt.name = 'Laptop' AND m.name = 'ThinkPad X1 Carbon' AND b.product_type_id = pt.id AND b.name = 'Lenovo';
UPDATE models m SET brand_id = b.id FROM brands b, product_types pt
WHERE m.product_type_id = pt.id AND pt.name = 'Laptop' AND m.name = 'ZenBook 14' AND b.product_type_id = pt.id AND b.name = 'ASUS';
UPDATE models m SET brand_id = b.id FROM brands b, product_types pt
WHERE m.product_type_id = pt.id AND pt.name = 'Laptop' AND m.name = 'Aspire 5' AND b.product_type_id = pt.id AND b.name = 'Acer';

INSERT INTO configurations (name, product_type_id)
SELECT '24 inch', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT '27 inch', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT '32 inch', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'IPS Panel', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'LED', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT '144Hz', id FROM product_types WHERE name = 'Monitor' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Mechanical', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Membrane', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Red Switch', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Blue Switch', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Brown Switch', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Wireless', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Wired', id FROM product_types WHERE name = 'Keyboard' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'i3 8GB RAM 256GB SSD', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'i5 8GB RAM 512GB SSD', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'i7 16GB RAM 1TB SSD', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Gaming RTX Series', id FROM product_types WHERE name = 'Laptop' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Inkjet', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Laser', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Color', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'Black & White', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;
INSERT INTO configurations (name, product_type_id)
SELECT 'WiFi Enabled', id FROM product_types WHERE name = 'Printer' LIMIT 1
ON CONFLICT (name, product_type_id) DO NOTHING;

-- Owner account (1,000,000 starting balance)
INSERT INTO accounts (name, account_type, balance)
SELECT 'Owner', 'owner', 1000000
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE account_type = 'owner' LIMIT 1);

-- Fix corrupted owner balance (e.g. NaN from invalid sale amounts)
UPDATE accounts SET balance = 1000000
WHERE account_type = 'owner' AND (balance IS NULL OR balance::text = 'NaN' OR balance <> balance);

-- Supplier accounts (auto-create for existing suppliers)
INSERT INTO accounts (name, account_type, balance, supplier_id)
SELECT s.name, 'supplier', 0, s.id FROM suppliers s
WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.supplier_id = s.id);
