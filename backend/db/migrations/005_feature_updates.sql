-- 005_feature_updates.sql
-- Updates for multi-chain support, loyalty rewards, merchant API, bulk discounts,
-- price alerts, referrals, NFT gift cards, escrow, and compliance.

-- Additional columns on orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS volume_discount_pct NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_points_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referral_discount_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_nft BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nft_token_id TEXT,
  ADD COLUMN IF NOT EXISTS is_escrow BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT,
  ADD COLUMN IF NOT EXISTS escrow_release_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_chain TEXT DEFAULT 'robinhood',
  ADD COLUMN IF NOT EXISTS solana_deposit_address TEXT;

-- User Loyalty Points and Tiers
CREATE TABLE IF NOT EXISTS user_loyalty (
  wallet_address TEXT PRIMARY KEY,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  order_id UUID,
  points_delta INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loyalty_tx_wallet_idx ON loyalty_transactions (wallet_address);

-- Merchant API and Direct Sales
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  total_volume NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS merchants_api_key_idx ON merchants (api_key);
CREATE INDEX IF NOT EXISTS merchants_wallet_idx ON merchants (wallet_address);

CREATE TABLE IF NOT EXISTS merchant_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  external_ref TEXT,
  product_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  face_value NUMERIC NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  card_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS merchant_orders_merchant_idx ON merchant_orders (merchant_id);

-- Price Alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  email TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  target_discount_pct NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_alerts_wallet_idx ON price_alerts (wallet_address);

-- Referral Program
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  order_id UUID,
  reward_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_wallet);

-- NFT-backed Gift Cards
CREATE TABLE IF NOT EXISTS nft_gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT UNIQUE NOT NULL,
  owner_wallet TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  face_value NUMERIC NOT NULL,
  claim_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  chain TEXT NOT NULL DEFAULT 'base',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nft_cards_owner_idx ON nft_gift_cards (owner_wallet);
