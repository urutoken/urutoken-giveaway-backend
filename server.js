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

// ✅ Giveaway-only rate limiter
const giveawayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP per 15 minutes
  message: {
    success: false,
    message: "Too many giveaway attempts. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ✅ Root Route
app.get("/", (req, res) => {

  res.json({
    status: "OK",
    message: "URUTOKEN Giveaway Backend Running"
  });

});

// ✅ Database Test Route
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

// ✅ Giveaway API with rate limit
app.use("/api/giveaway", giveawayLimiter, giveawayRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`URUTOKEN Giveaway Backend Running On Port ${PORT}`);

});