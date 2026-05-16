require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

// ✅ Routes
const webhookRoutes = require("./routes/webhook");
const userRoutes = require("./routes/user");
const presaleRoutes = require("./routes/presale");
const giveawayRoutes = require("./routes/giveaway"); // ✅ NEW

const app = express();

// ✅ Alchemy Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

app.use(express.json({ limit: "10mb" }));

// ✅ Root route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Urutoken backend running",
  });
});

// ✅ Block test route
app.get("/block", async (req, res) => {
  try {
    const block = await provider.getBlockNumber();

    res.json({ block });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

// ✅ Database test route
app.get("/db-test", async (req, res) => {

  try {

    const pool = require("./db");

    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "DB OK",
      time: result.rows[0].now
    });

  } catch (err) {

    res.status(500).json({
      status: "DB ERROR",
      error: err.message
    });

  }

});

// ✅ Existing routes
app.use("/webhook", webhookRoutes);
app.use("/api/user", userRoutes);
app.use("/api/presale", presaleRoutes);

// ✅ Giveaway route
app.use("/api/giveaway", giveawayRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`Urutoken backend running on port ${PORT}`);

});