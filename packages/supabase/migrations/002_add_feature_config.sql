-- ============================================================
-- Migration 002: Add feature_config column + update voice_config default
-- ============================================================

-- Add feature_config JSONB column for per-feature configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS feature_config JSONB NOT NULL DEFAULT '{}';

-- Update voice_config default to include personality field
ALTER TABLE agents ALTER COLUMN voice_config SET DEFAULT '{"tone": 50, "speed": 50, "accent": "neutral", "personality": "friendly"}';
