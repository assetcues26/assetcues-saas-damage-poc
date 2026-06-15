-- Allow deleting assets that were created via mobile QR sessions.
-- Without ON DELETE, saas_asset_create_sessions.created_asset_id blocks asset removal.

ALTER TABLE saas_asset_create_sessions
  DROP CONSTRAINT IF EXISTS saas_asset_create_sessions_created_asset_id_fkey;

ALTER TABLE saas_asset_create_sessions
  ADD CONSTRAINT saas_asset_create_sessions_created_asset_id_fkey
  FOREIGN KEY (created_asset_id)
  REFERENCES saas_registered_assets(id)
  ON DELETE SET NULL;
