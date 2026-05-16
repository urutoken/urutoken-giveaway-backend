const express = require("express");
const router = express.Router();

const pool = require("../db");


// ========================================
// GIVEAWAY LIVE STATS API
// ========================================

router.get("/stats", async (req, res) => {

  try {

    const result = await pool.query(
      `SELECT COUNT(*) FROM giveaway_entries`
    );

    const joined = parseInt(result.rows[0].count);

    const limit = 1000;

    res.json({
      success: true,
      joined,
      limit,
      remaining: limit - joined
    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Stats Error"
    });

  }

});


// ========================================
// ADMIN CSV EXPORT API
// ========================================

router.get("/export", async (req, res) => {

  try {

    const secret = req.query.secret;

    if (!process.env.EXPORT_SECRET || secret !== process.env.EXPORT_SECRET) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });

    }

    const result = await pool.query(
      `
      SELECT
        id,
        telegram,
        twitter,
        wallet,
        created_at
      FROM giveaway_entries
      ORDER BY id ASC
      `
    );

    const rows = result.rows;

    let csv = "id,telegram,twitter,wallet,created_at\n";

    rows.forEach((row) => {

      csv += [
        row.id,
        `"${String(row.telegram).replace(/"/g, '""')}"`,
        `"${String(row.twitter).replace(/"/g, '""')}"`,
        `"${String(row.wallet).replace(/"/g, '""')}"`,
        `"${row.created_at}"`
      ].join(",") + "\n";

    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=urutoken-giveaway-entries.csv"
    );

    res.status(200).send(csv);

  }

  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Export Error"
    });

  }

});


// ========================================
// GIVEAWAY JOIN API
// ========================================

router.post("/", async (req, res) => {

  try {

    const {
      telegram,
      twitter,
      wallet
    } = req.body;

    if (!telegram || !twitter || !wallet) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });

    }

    const totalEntries = await pool.query(
      `SELECT COUNT(*) FROM giveaway_entries`
    );

    const currentCount = parseInt(totalEntries.rows[0].count);

    if (currentCount >= 1000) {

      return res.status(400).json({
        success: false,
        message: "Giveaway Full - 1000 Participants Reached"
      });

    }

    const existingWallet = await pool.query(
      `
      SELECT * FROM giveaway_entries
      WHERE LOWER(wallet) = LOWER($1)
      `,
      [wallet]
    );

    if (existingWallet.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Wallet already joined giveaway"
      });

    }

    await pool.query(
      `
      INSERT INTO giveaway_entries
      (telegram, twitter, wallet)
      VALUES ($1, $2, $3)
      `,
      [telegram, twitter, wallet]
    );

    res.json({
      success: true,
      message: "Successfully Joined Giveaway"
    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

});

module.exports = router;