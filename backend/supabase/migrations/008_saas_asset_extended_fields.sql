-- Extended asset register fields for location and identification

ALTER TABLE saas_registered_assets
  ADD COLUMN IF NOT EXISTS serialnumber TEXT,
  ADD COLUMN IF NOT EXISTS sublocation TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
