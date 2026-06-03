-- AddGuestCardConfig
-- Adds commercialPackage to hotels and guestCards to hotel_settings so
-- the Guest App can later render configurable cards per hotel with a plan
-- driven limit. Both columns are safe nullable-like (Hotel.commercialPackage
-- has a String default, HotelSettings.guestCards has a Json default of []).

ALTER TABLE "hotels"
  ADD COLUMN "commercialPackage" TEXT NOT NULL DEFAULT 'boutique';

ALTER TABLE "hotel_settings"
  ADD COLUMN "guestCards" JSONB NOT NULL DEFAULT '[]'::jsonb;
