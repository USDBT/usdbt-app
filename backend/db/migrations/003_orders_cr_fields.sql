ALTER TABLE orders ADD COLUMN IF NOT EXISTS cr_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coin_amount numeric;

CREATE INDEX IF NOT EXISTS orders_cr_order_id_idx ON orders (cr_order_id);
