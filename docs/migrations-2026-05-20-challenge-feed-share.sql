ALTER TABLE challenge_proofs
ADD COLUMN share_to_feed TINYINT(1) NOT NULL DEFAULT 0
COMMENT '1 when the proof should also appear in the feed list'
AFTER proof_date;

CREATE INDEX idx_challenge_proofs_feed_visibility
ON challenge_proofs (share_to_feed, deleted_at, created_at);
