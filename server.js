require("dotenv").config();

const express = require("express");

// ✅ Giveaway Route
const giveawayRoutes = require("./routes/giveaway");

const app = express();

app.use(express.json({ limit: "10mb" }));

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

// ✅ Giveaway API
app.use("/api/giveaway", giveawayRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`URUTOKEN Giveaway Backend Running On Port ${PORT}`);

});