-- Add Prajwal Tomar as tier_2 competitor
INSERT INTO competitors (name, platform, profile_url, avatar_url, tier)
VALUES
  ('Prajwal Tomar', 'multi', 'https://x.com/PrajwalTomar_', NULL, 'tier_2')
ON CONFLICT DO NOTHING;
