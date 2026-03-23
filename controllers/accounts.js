const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const { account_type } = req.query;
    let query = `
      SELECT a.id, a.name, a.account_type, a.balance, a.supplier_id, s.name AS supplier_name
      FROM accounts a
      LEFT JOIN suppliers s ON a.supplier_id = s.id
    `;
    const params = [];
    if (account_type) {
      query += ' WHERE a.account_type = $1';
      params.push(account_type);
    }
    query += ' ORDER BY a.account_type, a.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getOwner(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, account_type, balance FROM accounts WHERE account_type = 'owner' LIMIT 1"
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Owner account not found' });
    }
    const row = result.rows[0];
    const balance = parseFloat(row.balance);
    row.balance = isNaN(balance) ? 0 : balance;
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function getBySupplierId(req, res) {
  try {
    const { supplierId } = req.params;
    const result = await pool.query(
      'SELECT id, name, account_type, balance, supplier_id FROM accounts WHERE supplier_id = $1',
      [supplierId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier account not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOwner, getBySupplierId };
