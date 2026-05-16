const express = require("express");
const { ethers } = require("ethers");
const pool = require("../db");

const router = express.Router();

const PRESALE_ADDRESS = process.env.PRESALE_CONTRACT_ADDRESS.toLowerCase();

const ABI = [
  "event PurchasedWithETH(address indexed buyer,uint256 ethAmount,uint256 usdValue,uint256 uruAmount,address indexed referrer,uint256 referralBonus)",
  "event PurchasedWithToken(address indexed buyer,address indexed token,uint256 tokenAmount,uint256 usdValue,uint256 uruAmount,address indexed referrer,uint256 referralBonus)",
  "event Claimed(address indexed user,uint256 amount)"
];

const iface = new ethers.Interface(ABI);

router.post("/", async (req, res) => {
  try {
    const logs = req.body?.event?.data?.block?.logs || [];

    for (const log of logs) {
      if (!log.address) continue;
      if (log.address.toLowerCase() !== PRESALE_ADDRESS) continue;

      let parsed;
      try {
        parsed = iface.parseLog(log);
      } catch {
        continue;
      }

      if (parsed.name === "PurchasedWithETH") {
        await pool.query(
          `INSERT INTO transactions 
          (wallet, payment_type, payment_token, amount_paid, usd_value, uru_amount, referrer, referral_bonus, tx_hash)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (tx_hash) DO NOTHING`,
          [
            parsed.args.buyer,
            "ETH",
            "ETH",
            parsed.args.ethAmount.toString(),
            parsed.args.usdValue.toString(),
            parsed.args.uruAmount.toString(),
            parsed.args.referrer,
            parsed.args.referralBonus.toString(),
            log.transactionHash,
          ]
        );
      }

      if (parsed.name === "PurchasedWithToken") {
        await pool.query(
          `INSERT INTO transactions 
          (wallet, payment_type, payment_token, amount_paid, usd_value, uru_amount, referrer, referral_bonus, tx_hash)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (tx_hash) DO NOTHING`,
          [
            parsed.args.buyer,
            "TOKEN",
            parsed.args.token,
            parsed.args.tokenAmount.toString(),
            parsed.args.usdValue.toString(),
            parsed.args.uruAmount.toString(),
            parsed.args.referrer,
            parsed.args.referralBonus.toString(),
            log.transactionHash,
          ]
        );
      }

      if (parsed.name === "Claimed") {
        await pool.query(
          `INSERT INTO claims 
          (wallet, amount, tx_hash)
          VALUES ($1,$2,$3)
          ON CONFLICT (tx_hash) DO NOTHING`,
          [
            parsed.args.user,
            parsed.args.amount.toString(),
            log.transactionHash,
          ]
        );
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Webhook error");
  }
});

module.exports = router;