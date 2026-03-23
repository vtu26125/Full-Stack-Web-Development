require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const { pool } = require('./config/db');

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const suppliersRouter = require('./routes/suppliers');
const purchasesRouter = require('./routes/purchases');
const salesRouter = require('./routes/sales');
const authRouter = require('./routes/auth');
const productTypesRouter = require('./routes/productTypes');
const brandsRouter = require('./routes/brands');
const configurationsRouter = require('./routes/configurations');
const modelsRouter = require('./routes/models');
const accountsRouter = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function initDatabase() {
  const sqlPath = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((s) => s.length > 0);
  const client = await pool.connect();
  try {
    for (const statement of statements) {
      if (statement) await client.query(statement + ';');
    }
    console.log('Database schema initialized successfully.');
  } finally {
    client.release();
  }
}

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/auth', authRouter);
app.use('/api/product-types', productTypesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/configurations', configurationsRouter);
app.use('/api/models', modelsRouter);
app.use('/api/accounts', accountsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Electronics Inventory System running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
