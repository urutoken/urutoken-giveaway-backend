CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  wallet TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  payment_token TEXT,
  amount_paid TEXT NOT NULL,
  usd_value TEXT NOT NULL,
  uru_amount TEXT NOT NULL,
  referrer TEXT,
  referral_bonus TEXT,
  tx_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  wallet TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);