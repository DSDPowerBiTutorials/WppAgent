-- ════════════════════════════════════════════════════════════
-- Migration 003: Drive – file storage metadata table
-- ════════════════════════════════════════════════════════════

-- File metadata table
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(127) NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  uploaded_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drive_files_org ON drive_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_category ON drive_files(organization_id, category);

-- RLS
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY drive_files_org_policy ON drive_files
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- Trigger
CREATE TRIGGER set_drive_files_updated_at
  BEFORE UPDATE ON drive_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
