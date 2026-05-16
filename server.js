require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// ✅ Giveaway Route
const giveawayRoutes = require("./routes/giveaway");

const app = express();

// ✅ Enable CORS
app.use(cors());

app.use(express.json({ limit: "10mb" }));

// ========================================
// GIVEAWAY RATE LIMITER
// ========================================

const giveawayLimiter = rateLimit({

  windowMs: 10 * 60 * 1000, // 10 minutes

  max: 10, // 10 requests per IP

  message: {
    success: false,
    message:
      "Security cooldown active. Please wait a few minutes before trying again."
  },

  standardHeaders: true,

  legacyHeaders: false

});

// ========================================
// ROOT ROUTE
// ========================================

app.get("/", (req, res) => {

  res.json({
    status: "OK",
    message: "URUTOKEN Giveaway Backend Running"
  });

});

// ========================================
// DATABASE TEST ROUTE
// ========================================

app.get("/db-test", async (req, res) => {

  try {

    const pool = require("./db");

    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "DB OK",
      time: result.rows[0].now
    });

  }

  catch (err) {

    res.status(500).json({
      status: "DB ERROR",
      error: err.message
    });

  }

});

// ========================================
// GIVEAWAY API
// ========================================

app.use(
  "/api/giveaway",
  giveawayLimiter,
  giveawayRoutes
);

const PORT = process.env.PORT || 5000;

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {

  console.log(
    `URUTOKEN Giveaway Backend Running On Port ${PORT}`
  );

});