const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    // ✅ FIXED: transactions → purchases
    const purchases = await pool.query(
      `SELECT * FROM purchases 
       WHERE LOWER(wallet) = $1 
       ORDER BY created_at DESC`,
      [wallet]
    );

    const claims = await pool.query(
      `SELECT * FROM claims 
       WHERE LOWER(wallet) = $1 
       ORDER BY created_at DESC`,
      [wallet]
    );

    // ✅ FIXED: transactions → purchases
    const totals = await pool.query(
      `SELECT 
        COALESCE(SUM(tokens::numeric),0) AS total_purchased,
        COALESCE(SUM(usd_value::numeric),0) AS total_usd_spent
       FROM purchases
       WHERE LOWER(wallet) = $1`,
      [wallet]
    );

    res.json({
      wallet,
      purchases: purchases.rows,
      claims: claims.rows,
      totals: totals.rows[0],
    });
  } catch (error) {
    console.error("User route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;