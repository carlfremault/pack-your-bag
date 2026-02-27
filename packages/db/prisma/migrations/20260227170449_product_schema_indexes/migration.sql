-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "app_product"."Category"("userId");

-- CreateIndex
CREATE INDEX "Item_userId_idx" ON "app_product"."Item"("userId");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "app_product"."List"("userId");

-- CreateIndex
CREATE INDEX "Pack_userId_idx" ON "app_product"."Pack"("userId");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "app_product"."Trip"("userId");
