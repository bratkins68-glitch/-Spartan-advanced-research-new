CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL,
  customer_json JSONB NOT NULL,
  shipping_json JSONB NOT NULL,
  items_json JSONB NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  shipping_service TEXT,
  shipping_weight_oz NUMERIC,
  payment_provider TEXT,
  payment_id TEXT,
  payment_status TEXT,
  payment_url TEXT,
  payment_json JSONB,
  email_sent_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_id_unique
  ON orders(payment_id) WHERE payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS webhook_events (
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_json JSONB NOT NULL,
  PRIMARY KEY(provider, event_key)
);


ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_request_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS orders_client_request_unique
  ON orders(client_request_id) WHERE client_request_id IS NOT NULL;


CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_idx
  ON order_status_history(order_id, created_at);


CREATE TABLE IF NOT EXISTS product_inventory (
  product_id TEXT PRIMARY KEY,
  quantity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_inventory_active_idx
  ON product_inventory(is_active);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_deducted_at TIMESTAMPTZ;
