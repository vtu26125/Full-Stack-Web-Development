const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name FROM product_types WHERE name IN ('Monitor', 'Keyboard', 'Laptop', 'Printer') ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll };
