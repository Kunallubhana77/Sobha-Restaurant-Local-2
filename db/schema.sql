-- One-time, idempotent schema for the Sobha school-demo ordering backend.
-- This records no customer or recipient phone number and does not handle payment
-- or actual restaurant fulfilment.

CREATE TABLE IF NOT EXISTS demo_orders (
  id UUID PRIMARY KEY,
  customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 1 AND 100),
  delivery_address TEXT NOT NULL CHECK (char_length(delivery_address) BETWEEN 5 AND 500),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 1000),
  items JSONB NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  total_rupees INTEGER NOT NULL CHECK (total_rupees > 0 AND total_rupees <= 2000000),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'preparing', 'on_the_way', 'arrived', 'delivered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_orders_created_at_idx
  ON demo_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS demo_orders_status_idx
  ON demo_orders (status);

CREATE TABLE IF NOT EXISTS demo_order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES demo_orders (id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('order_created', 'status_update')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'not_configured')),
  provider_sid TEXT,
  error_code TEXT,
  message_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_order_messages_order_created_idx
  ON demo_order_messages (order_id, created_at DESC);
