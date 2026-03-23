const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.contact, s.email, s.address, s.created_at,
              COALESCE(a.balance, 0)::numeric(12,2) AS balance
       FROM suppliers s
       LEFT JOIN accounts a ON a.supplier_id = s.id AND a.account_type = 'supplier'
       ORDER BY s.name`
    );
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
      'SELECT id, name, contact, email, address, created_at FROM suppliers WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, contact, email, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const supplierResult = await client.query(
        'INSERT INTO suppliers (name, contact, email, address) VALUES ($1, $2, $3, $4) RETURNING id, name, contact, email, address, created_at',
        [name.trim(), contact || null, email || null, address || null]
      );
      const supplier = supplierResult.rows[0];
      await client.query(
        'INSERT INTO accounts (name, account_type, balance, supplier_id) VALUES ($1, $2, 0, $3)',
        [supplier.name, 'supplier', supplier.id]
      );
      await client.query('COMMIT');
      res.status(201).json(supplier);
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

async function update(req, res) {
  try {
    const { id } = req.params;
    const { name, contact, email, address } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    const result = await pool.query(
      'UPDATE suppliers SET name = $1, contact = $2, email = $3, address = $4 WHERE id = $5 RETURNING id, name, contact, email, address, created_at',
      [name.trim(), contact || null, email || null, address || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove };
