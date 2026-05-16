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

    const joined = parseInt(
      result.rows[0].count
    );

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
// GIVEAWAY JOIN API
// ========================================

router.post("/", async (req, res) => {

  try {

    const {
      telegram,
      twitter,
      wallet
    } = req.body;

    // Required fields
    if (!telegram || !twitter || !wallet) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });

    }

    // Giveaway limit check
    const totalEntries = await pool.query(
      `SELECT COUNT(*) FROM giveaway_entries`
    );

    const currentCount = parseInt(
      totalEntries.rows[0].count
    );

    // Giveaway Full
    if (currentCount >= 1000) {

      return res.status(400).json({
        success: false,
        message: "Giveaway Full - 1000 Participants Reached"
      });

    }

    // Duplicate wallet check
    const existingWallet = await pool.query(

      `
      SELECT * FROM giveaway_entries
      WHERE wallet = $1
      `,

      [wallet]

    );

    if (existingWallet.rows.length > 0) {

      return res.status(400).json({
        success: false,
        message: "Wallet already joined giveaway"
      });

    }

    // Insert entry
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