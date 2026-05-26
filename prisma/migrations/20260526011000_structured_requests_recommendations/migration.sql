ALTER TABLE "service_requests"
  ADD COLUMN "details" JSONB;

ALTER TABLE "recommendations"
  ADD COLUMN "image_url" TEXT,
  ADD COLUMN "tags" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "opening_hours" TEXT,
  ADD COLUMN "google_place_id" TEXT,
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
