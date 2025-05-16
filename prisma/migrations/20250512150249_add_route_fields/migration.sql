-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "closestLandmark" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "imagesJson" TEXT,
ADD COLUMN     "numberOfStreetPoles" INTEGER,
ADD COLUMN     "pricePerStreetPole" DOUBLE PRECISION,
ADD COLUMN     "sideRoute" TEXT,
ALTER COLUMN "routeName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaticMediaFace" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "imagesJson" TEXT,
ADD COLUMN     "rent" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "location" TEXT;
