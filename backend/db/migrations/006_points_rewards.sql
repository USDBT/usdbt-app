-- Points rewards on delivered orders (pre-launch), and $USDBT payouts once the token launches.

-- The referrer is resolved and validated at checkout; rewards are credited to this wallet on delivery.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_wallet TEXT;

-- One ledger row per (order, wallet, action) so crediting a delivered order twice is a no-op.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_tx_order_action_uniq
  ON loyalty_transactions (order_id, wallet_address, action)
  WHERE order_id IS NOT NULL;

-- Points converted to $USDBT after launch. Paid manually in batches, then marked paid with the tx hash.
CREATE TABLE IF NOT EXISTS usdbt_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  points INTEGER NOT NULL,
  value_usd NUMERIC NOT NULL,
  price_usd NUMERIC NOT NULL,
  usdbt_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested', -- requested | paid | rejected
  tx_hash TEXT,
  note TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS usdbt_payouts_wallet_idx ON usdbt_payouts (wallet_address);
CREATE INDEX IF NOT EXISTS usdbt_payouts_status_idx ON usdbt_payouts (status);
