-- 推荐关系表
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id TEXT NOT NULL,
  invitee_id TEXT,
  invite_code TEXT NOT NULL,
  activated BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- 推荐索引
CREATE INDEX IF NOT EXISTS idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_id ON referrals(invitee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invite_code ON referrals(invite_code);
