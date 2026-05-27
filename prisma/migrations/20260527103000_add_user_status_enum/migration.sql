CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

ALTER TABLE "users"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "UserStatus" USING "status"::"UserStatus",
  ALTER COLUMN "status" SET DEFAULT 'active';
