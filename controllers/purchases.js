const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const result = await pool.query(`
      SELECT pur.id, pur.product_id, pur.quantity, pur.unit_price, pur.total_amount, pur.purchase_date, pur.notes,
             p.name AS product_name, p.sku
      FROM purchases pur
      JOIN products p ON pur.product_id = p.id
      ORDER BY pur.purchase_date DESC
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
      `SELECT pur.id, pur.product_id, pur.quantity, pur.unit_price, pur.total_amount, pur.purchase_date, pur.notes
       FROM purchases pur
       WHERE pur.product_id = $1
       ORDER BY pur.purchase_date DESC`,
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
        'SELECT id, supplier_id, quantity, unit_price FROM products WHERE id = $1',
        [product_id]
      );
      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: 'Product not found' });
      }
      const product = productResult.rows[0];
      const reqPrice = (unit_price != null && unit_price !== '') ? parseFloat(unit_price) : NaN;
      const prodPrice = parseFloat(product.unit_price) || 0;
      const price = !isNaN(reqPrice) && reqPrice >= 0 ? reqPrice : prodPrice;
      const total = qty * price;
      if (isNaN(total) || total <= 0) {
        return res.status(400).json({
          error: 'Please enter a valid unit price, or set the product unit price. Purchase amount must be greater than zero.',
        });
      }
      const supplierId = product.supplier_id;
      if (!supplierId) {
        return res.status(400).json({ error: 'This product has no supplier. Assign a supplier in the product details first.' });
      }
      const ownerResult = await client.query(
        "SELECT id, balance FROM accounts WHERE account_type = 'owner' LIMIT 1"
      );
      if (ownerResult.rows.length === 0) {
        return res.status(500).json({ error: 'Owner account not found' });
      }
      const owner = ownerResult.rows[0];
      const ownerBalance = parseFloat(owner.balance) || 0;
      if (ownerBalance < total) {
        return res.status(400).json({
          error: `Insufficient owner balance. Available: ₹${ownerBalance.toFixed(2)}, required: ₹${total.toFixed(2)}. Please add funds or reduce quantity.`,
        });
      }
      const supplierAccountResult = await client.query(
        'SELECT id FROM accounts WHERE supplier_id = $1',
        [supplierId]
      );
      if (supplierAccountResult.rows.length === 0) {
        return res.status(400).json({ error: 'Supplier account not found. Please add this supplier first.' });
      }
      const supplierAccountId = supplierAccountResult.rows[0].id;
      await client.query('BEGIN');
      const insertResult = await client.query(
        `INSERT INTO purchases (product_id, quantity, unit_price, total_amount, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, product_id, quantity, unit_price, total_amount, purchase_date, notes`,
        [product_id, qty, price, total, notes || null]
      );
      const purchaseId = insertResult.rows[0].id;
      await client.query(
        'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [qty, product_id]
      );
      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [total, owner.id]
      );
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [total, supplierAccountId]
      );
      await client.query(
        `INSERT INTO transactions (from_account, to_account, amount, transaction_type, reference_id)
         VALUES ($1, $2, $3, 'purchase', $4)`,
        [owner.id, supplierAccountId, total, purchaseId]
      );
      await client.query('COMMIT');
      res.status(201).json(insertResult.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      if (e.code === '23503') {
        return res.status(400).json({ error: 'Product not found' });
      }
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
