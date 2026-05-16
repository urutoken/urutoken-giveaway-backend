const express = require("express");
const router = express.Router();

const pool = require("../db");

router.post("/", async (req, res) => {

  try {

    const {
      telegram,
      twitter,
      wallet
    } = req.body;

    // Required fields check
    if (!telegram || !twitter || !wallet) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
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

    // Insert new entry
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
      message: "Joined giveaway successfully"
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