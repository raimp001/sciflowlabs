-- Migration: Add frame notification tokens table
-- This table stores Farcaster frame notification tokens for push notifications

CREATE TABLE IF NOT EXISTS frame_notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid BIGINT UNIQUE NOT NULL,
  notification_url TEXT NOT NULL,
  notification_token TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_frame_notification_tokens_fid ON frame_notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_frame_notification_tokens_enabled ON frame_notification_tokens(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_frame_notification_tokens_user_id ON frame_notification_tokens(user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_frame_notification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS frame_notification_tokens_updated_at ON frame_notification_tokens;
CREATE TRIGGER frame_notification_tokens_updated_at
  BEFORE UPDATE ON frame_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_frame_notification_tokens_updated_at();

-- RLS policies
ALTER TABLE frame_notification_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage tokens (webhook uses service role)
CREATE POLICY "Service role can manage frame tokens" ON frame_notification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE frame_notification_tokens IS 'Stores Farcaster frame notification tokens for sending push notifications to users';
COMMENT ON COLUMN frame_notification_tokens.fid IS 'Farcaster ID of the user';
COMMENT ON COLUMN frame_notification_tokens.notification_url IS 'URL to send notifications to';
COMMENT ON COLUMN frame_notification_tokens.notification_token IS 'Token for authenticating notifications';
COMMENT ON COLUMN frame_notification_tokens.enabled IS 'Whether notifications are currently enabled';
COMMENT ON COLUMN frame_notification_tokens.user_id IS 'Optional link to our users table if FID is mapped';
