-- ============================================================
-- Development seed data
-- ============================================================

-- Dev organization (fixed UUID for dev bypass)
INSERT INTO organizations (id, name, slug, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Clínica Dev',
  'clinica-dev',
  '11999999999'
) ON CONFLICT (id) DO NOTHING;
