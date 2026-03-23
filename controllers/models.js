const { pool } = require('../config/db');

async function getAll(req, res) {
  try {
    const { product_type_id, brand_id } = req.query;
    if (product_type_id && brand_id) {
      const result = await pool.query(
        'SELECT id, name, product_type_id, brand_id FROM models WHERE product_type_id = $1 AND brand_id = $2 ORDER BY name',
        [product_type_id, brand_id]
      );
      return res.json(result.rows);
    }
    if (product_type_id) {
      const result = await pool.query(
        'SELECT id, name, product_type_id, brand_id FROM models WHERE product_type_id = $1 ORDER BY name',
        [product_type_id]
      );
      return res.json(result.rows);
    }
    const result = await pool.query(
      'SELECT id, name, product_type_id, brand_id FROM models ORDER BY product_type_id, name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll };
