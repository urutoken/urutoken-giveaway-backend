const express = require("express");
const { ethers } = require("ethers");
const pool = require("../db");

const router = express.Router();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const PRESALE_ADDRESS = String(process.env.PRESALE_CONTRACT_ADDRESS || "").toLowerCase();

const PURCHASE_ABI = [
  "event PurchasedWithETH(address indexed buyer,uint256 ethAmount,uint256 usdValue,uint256 uruAmount,address indexed referrer,uint256 referralBonus)",
  "event PurchasedWithToken(address indexed buyer,address indexed token,uint256 tokenAmount,uint256 usdValue,uint256 uruAmount,address indexed referrer,uint256 referralBonus)"
];

const iface = new ethers.Interface(PURCHASE_ABI);

const TOKEN_SYMBOLS = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
  "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",
  "0x1f9840a85d5af5bf1d1762f925bddadc4201f984": "UNI",
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE"
};

function toNumberString(value, decimals = 18) {
  return ethers.formatUnits(value, decimals);
}

router.post("/", async (req, res) => {
  try {
    const wallet = String(req.body.wallet || "").toLowerCase();
    const txHash = String(req.body.tx_hash || req.body.txHash || "").trim();

    if (!PRESALE_ADDRESS) {
      return res.status(500).json({
        success: false,
        error: "PRESALE_CONTRACT_ADDRESS is not configured"
      });
    }

    if (!txHash || !txHash.startsWith("0x")) {
      return res.status(400).json({
        success: false,
        error: "Valid tx_hash is required"
      });
    }

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found on Ethereum Mainnet"
      });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({
        success: false,
        error: "Transaction failed or was rejected on-chain"
      });
    }

    let verifiedPurchase = null;

    for (const log of receipt.logs) {
      if (!log.address || log.address.toLowerCase() !== PRESALE_ADDRESS) {
        continue;
      }

      let parsed;
      try {
        parsed = iface.parseLog(log);
      } catch (err) {
        continue;
      }

      if (!parsed) continue;

      if (parsed.name === "PurchasedWithETH") {
        const buyer = String(parsed.args.buyer).toLowerCase();

        if (wallet && buyer !== wallet) {
          return res.status(400).json({
            success: false,
            error: "Wallet address does not match transaction buyer"
          });
        }

        verifiedPurchase = {
          wallet: buyer,
          currency: "ETH",
          amount: toNumberString(parsed.args.ethAmount, 18),
          usd_value: toNumberString(parsed.args.usdValue, 18),
          tokens: toNumberString(parsed.args.uruAmount, 18),
          tx_hash: txHash,
          status: "confirmed"
        };
      }

      if (parsed.name === "PurchasedWithToken") {
        const buyer = String(parsed.args.buyer).toLowerCase();
        const tokenAddress = String(parsed.args.token).toLowerCase();
        const symbol = TOKEN_SYMBOLS[tokenAddress] || tokenAddress;

        if (wallet && buyer !== wallet) {
          return res.status(400).json({
            success: false,
            error: "Wallet address does not match transaction buyer"
          });
        }

        verifiedPurchase = {
          wallet: buyer,
          currency: symbol,
          amount: parsed.args.tokenAmount.toString(),
          usd_value: toNumberString(parsed.args.usdValue, 18),
          tokens: toNumberString(parsed.args.uruAmount, 18),
          tx_hash: txHash,
          status: "confirmed"
        };
      }
    }

    if (!verifiedPurchase) {
      return res.status(400).json({
        success: false,
        error: "No valid Urutoken purchase event found in this transaction"
      });
    }

    const result = await pool.query(
      `INSERT INTO purchases
        (wallet, currency, amount, usd_value, tokens, tx_hash, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (tx_hash)
       DO UPDATE SET
        wallet = EXCLUDED.wallet,
        currency = EXCLUDED.currency,
        amount = EXCLUDED.amount,
        usd_value = EXCLUDED.usd_value,
        tokens = EXCLUDED.tokens,
        status = EXCLUDED.status
       RETURNING *`,
      [
        verifiedPurchase.wallet,
        verifiedPurchase.currency,
        verifiedPurchase.amount,
        verifiedPurchase.usd_value,
        verifiedPurchase.tokens,
        verifiedPurchase.tx_hash,
        verifiedPurchase.status
      ]
    );

    return res.json({
      success: true,
      message: "Transaction verified on Ethereum Mainnet and saved",
      purchase: result.rows[0]
    });

  } catch (error) {
    console.error("Secure buy verification error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Verification failed"
    });
  }
});

module.exports = router;