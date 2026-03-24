-- ============================================================
-- Migration 004: Exams/Procedures Catalog
-- Stores the full catalog of exams, procedures, and services
-- offered by the clinic, including preparation instructions
-- ============================================================

CREATE TABLE IF NOT EXISTS exams_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'outros',
  preparation TEXT,
  requires_medical_order BOOLEAN NOT NULL DEFAULT false,
  medical_order_notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_exams_catalog_org ON exams_catalog(organization_id);
CREATE INDEX idx_exams_catalog_org_category ON exams_catalog(organization_id, category);
CREATE INDEX idx_exams_catalog_org_name ON exams_catalog(organization_id, name);

-- Full-text search index for exam name search
CREATE INDEX idx_exams_catalog_name_trgm ON exams_catalog 
  USING gin (name gin_trgm_ops);

-- Enable trigram extension for fuzzy search (if not already)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Auto-update trigger
CREATE TRIGGER update_exams_catalog_updated_at
  BEFORE UPDATE ON exams_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
