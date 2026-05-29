CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  email text NOT NULL,
  card_type text NOT NULL DEFAULT 'gift_card',
  brand_id text NOT NULL,
  brand_name text NOT NULL,
  face_value numeric NOT NULL,
  payment_currency text NOT NULL,
  payment_amount numeric NOT NULL,
  fee_rate numeric NOT NULL,
  status text NOT NULL,
  expires_at timestamptz NOT NULL,
  tx_hash text,
  failure_reason text,
  reloadly_order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_wallet_idx ON orders (wallet_address);
