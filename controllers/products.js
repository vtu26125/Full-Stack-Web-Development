const { pool } = require('../config/db');

async function generateUniqueSKU(pool) {
  for (let i = 0; i < 10; i++) {
    const code = 'PRD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const r = await pool.query('SELECT 1 FROM products WHERE sku = $1', [code]);
    if (r.rows.length === 0) return code;
  }
  throw new Error('Could not generate unique SKU');
}

async function getAll(req, res) {
  try {
    const result = await pool.query(`
      SELECT p.id, p.model_id, p.name, p.sku, p.supplier_id, p.type_id, p.brand_id, p.config_id, p.unit,
             p.min_stock, p.quantity, p.unit_price, p.created_at, p.updated_at,
             COALESCE(m.name, p.name) AS display_name,
             m.name AS model_name,
             s.name AS supplier_name,
             pt.name AS type_name,
             b.name AS brand_name,
             c.name AS config_name,
             COALESCE(sold.units_sold, 0)::integer AS units_sold
      FROM products p
      LEFT JOIN models m ON p.model_id = m.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN product_types pt ON p.type_id = pt.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN configurations c ON p.config_id = c.id
      LEFT JOIN (SELECT product_id, SUM(quantity) AS units_sold FROM sales GROUP BY product_id) sold ON p.id = sold.product_id
      ORDER BY COALESCE(m.name, p.name)
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.id, p.model_id, p.name, p.sku, p.supplier_id, p.type_id, p.brand_id, p.config_id, p.unit,
              p.min_stock, p.quantity, p.unit_price, p.created_at, p.updated_at,
              COALESCE(m.name, p.name) AS display_name,
              m.name AS model_name,
              s.name AS supplier_name,
              pt.name AS type_name,
              b.name AS brand_name,
              c.name AS config_name,
              COALESCE(sold.units_sold, 0)::integer AS units_sold
       FROM products p
       LEFT JOIN models m ON p.model_id = m.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN product_types pt ON p.type_id = pt.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN configurations c ON p.config_id = c.id
       LEFT JOIN (SELECT product_id, SUM(quantity) AS units_sold FROM sales GROUP BY product_id) sold ON p.id = sold.product_id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { model_id, supplier_id, type_id, brand_id, config_id, unit, min_stock, quantity, unit_price } = req.body;
    if (!model_id) {
      return res.status(400).json({ error: 'Model is required' });
    }
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const min = Math.max(0, parseInt(min_stock, 10) || 0);
    const price = parseFloat(unit_price) || 0;
    const total = qty * price;
    const supId = supplier_id ? parseInt(supplier_id, 10) : null;
    const client = await pool.connect();
    try {
      const modelRow = await client.query('SELECT name FROM models WHERE id = $1', [model_id]);
      if (modelRow.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid model' });
      }
      const name = modelRow.rows[0].name;
      if (qty > 0 && total > 0 && supId) {
        const ownerRow = await client.query("SELECT id, balance FROM accounts WHERE account_type = 'owner' LIMIT 1");
        if (ownerRow.rows.length === 0) {
          return res.status(500).json({ error: 'Owner account not found' });
        }
        const owner = ownerRow.rows[0];
        const ownerBalance = parseFloat(owner.balance) || 0;
        if (ownerBalance < total) {
          return res.status(400).json({
            error: `Insufficient owner balance. Available: ₹${ownerBalance.toFixed(2)}, required: ₹${total.toFixed(2)}. Add funds or reduce quantity.`,
          });
        }
        const supplierAccRow = await client.query('SELECT id FROM accounts WHERE supplier_id = $1', [supId]);
        if (supplierAccRow.rows.length === 0) {
          return res.status(400).json({ error: 'Supplier account not found. Please add this supplier first.' });
        }
        const supplierAccId = supplierAccRow.rows[0].id;
        const sku = await generateUniqueSKU(pool);
        await client.query('BEGIN');
        const insertResult = await client.query(
          `INSERT INTO products (name, sku, supplier_id, type_id, brand_id, model_id, config_id, unit, min_stock, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id, name, sku, supplier_id, type_id, brand_id, model_id, config_id, unit, min_stock, quantity, unit_price, created_at, updated_at`,
          [
            name,
            sku,
            supId,
            type_id || null,
            brand_id || null,
            model_id,
            config_id || null,
            unit ? unit.trim() : null,
            min,
            qty,
            price,
          ]
        );
        const product = insertResult.rows[0];
        const purchaseResult = await client.query(
          `INSERT INTO purchases (product_id, quantity, unit_price, total_amount, notes)
           VALUES ($1, $2, $3, $4, 'Initial stock on product add')
           RETURNING id`,
          [product.id, qty, price, total]
        );
        const purchaseId = purchaseResult.rows[0].id;
        await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [total, owner.id]);
        await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [total, supplierAccId]);
        await client.query(
          `INSERT INTO transactions (from_account, to_account, amount, transaction_type, reference_id)
           VALUES ($1, $2, $3, 'purchase', $4)`,
          [owner.id, supplierAccId, total, purchaseId]
        );
        await client.query('COMMIT');
        res.status(201).json(product);
      } else {
        const sku = await generateUniqueSKU(pool);
        const result = await client.query(
          `INSERT INTO products (name, sku, supplier_id, type_id, brand_id, model_id, config_id, unit, min_stock, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id, name, sku, supplier_id, type_id, brand_id, model_id, config_id, unit, min_stock, quantity, unit_price, created_at, updated_at`,
          [
            name,
            sku,
            supId,
            type_id || null,
            brand_id || null,
            model_id,
            config_id || null,
            unit ? unit.trim() : null,
            min,
            qty,
            price,
          ]
        );
        res.status(201).json(result.rows[0]);
      }
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { model_id, supplier_id, type_id, brand_id, config_id, unit, min_stock, quantity, unit_price } = req.body;
    if (!model_id) {
      return res.status(400).json({ error: 'Model is required' });
    }
    const modelRow = await pool.query('SELECT name FROM models WHERE id = $1', [model_id]);
    if (modelRow.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid model' });
    }
    const name = modelRow.rows[0].name;
    const min = Math.max(0, parseInt(min_stock, 10) || 0);
    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const price = parseFloat(unit_price) || 0;
    const result = await pool.query(
      `UPDATE products
       SET name = $1, supplier_id = $2, type_id = $3, brand_id = $4, model_id = $5, config_id = $6, unit = $7,
           min_stock = $8, quantity = $9, unit_price = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING id, name, sku, supplier_id, type_id, brand_id, model_id, config_id, unit, min_stock, quantity, unit_price, created_at, updated_at`,
      [
        name,
        supplier_id || null,
        type_id || null,
        brand_id || null,
        model_id,
        config_id || null,
        unit ? unit.trim() : null,
        min,
        qty,
        price,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getLowStock(req, res) {
  try {
    const result = await pool.query(`
      SELECT p.id, p.model_id, p.name, p.sku, p.type_id, p.brand_id, p.config_id, p.unit, p.min_stock, p.quantity, p.unit_price,
             COALESCE(m.name, p.name) AS display_name,
             m.name AS model_name,
             pt.name AS type_name,
             b.name AS brand_name,
             c.name AS config_name,
             COALESCE(sold.units_sold, 0)::integer AS units_sold
      FROM products p
      LEFT JOIN models m ON p.model_id = m.id
      LEFT JOIN product_types pt ON p.type_id = pt.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN configurations c ON p.config_id = c.id
      LEFT JOIN (SELECT product_id, SUM(quantity) AS units_sold FROM sales GROUP BY product_id) sold ON p.id = sold.product_id
      WHERE p.quantity <= p.min_stock
      ORDER BY p.quantity ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove, getLowStock };
