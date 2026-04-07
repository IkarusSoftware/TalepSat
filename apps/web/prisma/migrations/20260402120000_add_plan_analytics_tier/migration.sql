ALTER TABLE "Plan"
ADD COLUMN "analyticsTier" TEXT NOT NULL DEFAULT 'none';

UPDATE "Plan"
SET "analyticsTier" = CASE
  WHEN "slug" = 'basic' THEN 'basic'
  WHEN "slug" = 'plus' THEN 'plus'
  WHEN "slug" = 'pro' THEN 'pro'
  WHEN "analytics" = true THEN 'basic'
  ELSE 'none'
END;
