-- AddHotelEnabledServices
-- Adds the enabledServices JSON column to hotel_settings so the
-- Super Admin and Hotel Admin can configure which services are
-- available per hotel within the limits of the commercial plan.
-- Existing rows get a safe empty array default.

ALTER TABLE "hotel_settings"
  ADD COLUMN "enabledServices" JSONB NOT NULL DEFAULT '[]'::jsonb;
