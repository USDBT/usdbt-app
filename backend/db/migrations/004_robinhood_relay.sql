-- Robinhood Chain payments via Relay: record the origin chain, the exact
-- origin-currency amount charged, and the Relay solver's request/steps.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_chain_id INTEGER DEFAULT 4663,
  ADD COLUMN IF NOT EXISTS payment_amount_exact text,
  ADD COLUMN IF NOT EXISTS relay_request_id text,
  ADD COLUMN IF NOT EXISTS relay_steps jsonb;
