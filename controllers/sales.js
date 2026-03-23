const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const result = await pool.query(`
      SELECT s.id, s.product_id, s.quantity, s.unit_price, s.total_amount, s.sale_date, s.notes,
             p.name AS product_name, p.sku
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getByProduct(req, res) {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.product_id, s.quantity, s.unit_price, s.total_amount, s.sale_date, s.notes
       FROM sales s
       WHERE s.product_id = $1
       ORDER BY s.sale_date DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { product_id, quantity, unit_price, notes } = req.body;
    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and positive quantity are required' });
    }
    const qty = parseInt(quantity, 10);
    const client = await pool.connect();
    try {
      const productResult = await client.query(
        'SELECT id, quantity, unit_price, min_stock FROM products WHERE id = $1',
        [product_id]
      );
      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: 'Product not found' });
      }
      const product = productResult.rows[0];
      const available = parseInt(product.quantity, 10);
      const minStock = parseInt(product.min_stock, 10) || 0;
      const maxSellable = Math.max(0, available - minStock);
      if (available < qty) {
        return res.status(400).json({
          error: `Insufficient stock. Only ${available} units available. You requested ${qty} units.`,
        });
      }
      if (qty > maxSellable) {
        return res.status(400).json({
          error: `Stock reserved for min level. ${minStock} units must remain. You can sell up to ${maxSellable} units (${available} in stock − ${minStock} reserved).`,
        });
      }
      const ownerResult = await client.query(
        "SELECT id FROM accounts WHERE account_type = 'owner' LIMIT 1"
      );
      if (ownerResult.rows.length === 0) {
        return res.status(500).json({ error: 'Owner account not found' });
      }
      const ownerId = ownerResult.rows[0].id;
      const reqPrice = (unit_price != null && unit_price !== '') ? parseFloat(unit_price) : NaN;
      const prodPrice = parseFloat(product.unit_price) || 0;
      const price = !isNaN(reqPrice) && reqPrice >= 0 ? reqPrice : prodPrice;
      const total = qty * price;
      if (isNaN(total) || total <= 0) {
        return res.status(400).json({
          error: 'Please enter a valid unit price, or set the product unit price. Sale amount must be greater than zero.',
        });
      }
      await client.query('BEGIN');
      const insertResult = await client.query(
        `INSERT INTO sales (product_id, customer_id, quantity, unit_price, total_amount, notes)
         VALUES ($1, NULL, $2, $3, $4, $5)
         RETURNING id, product_id, quantity, unit_price, total_amount, sale_date, notes`,
        [product_id, qty, price, total, notes || null]
      );
      const saleId = insertResult.rows[0].id;
      await client.query(
        'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [qty, product_id]
      );
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [total, ownerId]
      );
      await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, transaction_type, reference_id)
         VALUES (NULL, $1, $2, 'sale', $3)`,
        [ownerId, total, saleId]
      );
      await client.query('COMMIT');
      res.status(201).json(insertResult.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getByProduct, create };
