-- CreateTable
CREATE TABLE "app_product"."Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorCode" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."Item" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."List" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorCode" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."Pack" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorCode" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."Trip" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "packId" UUID NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."ItemList" (
    "id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemId" UUID NOT NULL,
    "listId" UUID NOT NULL,

    CONSTRAINT "ItemList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."ItemPack" (
    "id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemId" UUID NOT NULL,
    "packId" UUID NOT NULL,

    CONSTRAINT "ItemPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_product"."ListPack" (
    "id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "listId" UUID NOT NULL,
    "packId" UUID NOT NULL,

    CONSTRAINT "ListPack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemList_itemId_listId_key" ON "app_product"."ItemList"("itemId", "listId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPack_itemId_packId_key" ON "app_product"."ItemPack"("itemId", "packId");

-- CreateIndex
CREATE UNIQUE INDEX "ListPack_listId_packId_key" ON "app_product"."ListPack"("listId", "packId");

-- AddForeignKey
ALTER TABLE "app_product"."Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "app_product"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."Trip" ADD CONSTRAINT "Trip_packId_fkey" FOREIGN KEY ("packId") REFERENCES "app_product"."Pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ItemList" ADD CONSTRAINT "ItemList_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "app_product"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ItemList" ADD CONSTRAINT "ItemList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "app_product"."List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ItemPack" ADD CONSTRAINT "ItemPack_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "app_product"."Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ItemPack" ADD CONSTRAINT "ItemPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "app_product"."Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ListPack" ADD CONSTRAINT "ListPack_listId_fkey" FOREIGN KEY ("listId") REFERENCES "app_product"."List"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product"."ListPack" ADD CONSTRAINT "ListPack_packId_fkey" FOREIGN KEY ("packId") REFERENCES "app_product"."Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
