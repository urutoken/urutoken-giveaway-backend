const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(uru_amount::numeric),0) AS total_sold,
        COALESCE(SUM(usd_value::numeric),0) AS total_raised,
        COUNT(DISTINCT LOWER(wallet)) AS total_buyers
       FROM transactions`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Presale stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;