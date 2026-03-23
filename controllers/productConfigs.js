const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const { type_id } = req.query;
    if (type_id) {
      const result = await pool.query(
        'SELECT id, type_id, name, details FROM product_configs WHERE type_id = $1 ORDER BY name',
        [type_id]
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      'SELECT id, type_id, name, details FROM product_configs ORDER BY type_id, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll };
