CREATE TABLE IF NOT EXISTS webhook_events (
  id text PRIMARY KEY,
  source text NOT NULL,
  event_key text NOT NULL,
  invoice_id text,
  provider_order_id text,
  provider_status text,
  state text NOT NULL DEFAULT 'received',
  created_at timestamptz DEFAULT now()
);
