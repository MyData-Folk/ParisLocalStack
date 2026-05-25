ALTER TABLE "guests"
  ADD COLUMN "internal_notes" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "crm_tags" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "relationship_status" TEXT NOT NULL DEFAULT 'normal';
