-- Migration 005: Add auth_id to users for Supabase Auth integration
-- Links public.users to auth.users for authentication

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
