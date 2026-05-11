-- CreateTable
CREATE TABLE "app_product"."TripItemStatus" (
    "id" UUID NOT NULL,
    "packedQuantity" INTEGER NOT NULL DEFAULT 0,
    "tripId" UUID NOT NULL,
    "itemId" UUID NOT NULL,

    CONSTRAINT "TripItemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripItemStatus_tripId_idx" ON "app_product"."TripItemStatus"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripItemStatus_tripId_itemId_key" ON "app_product"."TripItemStatus"("tripId", "itemId");

-- AddForeignKey
ALTER TABLE "app_product"."TripItemStatus" ADD CONSTRAINT "TripItemStatus_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "app_product"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."TripItemStatus" ADD CONSTRAINT "TripItemStatus_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "app_product"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
