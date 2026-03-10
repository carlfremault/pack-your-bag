import { IntegrationTestContext } from 'test/helpers/setup.helpers';

export const createItemInCategory = async (ctx: IntegrationTestContext, accessToken: string) => {
  const { body: category } = await ctx.categoryHelpers.createCategory({
    payload: ctx.categoryHelpers.defaultCategoryDto,
    accessToken,
  });
  const { body: item } = await ctx.itemHelpers.createItem({
    payload: { ...ctx.itemHelpers.defaultItemDto, categoryId: category.id },
    accessToken,
  });

  return { item, category };
};

export const createItemOnList = async (ctx: IntegrationTestContext, accessToken: string) => {
  const [{ body: item }, { body: list }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
  ]);

  const { body: itemList } = await ctx.itemListHelpers.upsertItemOnList({
    payload: { itemId: item.id, listId: list.id, quantity: 1 },
    accessToken,
  });

  return { item, list, itemList };
};

export const createMultipleItemsOnList = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: item1 }, { body: item2 }, { body: list }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
  ]);

  const [{ body: itemList1 }, { body: itemList2 }] = await Promise.all([
    ctx.itemListHelpers.upsertItemOnList({
      payload: { itemId: item1.id, listId: list.id, quantity: 1 },
      accessToken,
    }),
    ctx.itemListHelpers.upsertItemOnList({
      payload: { itemId: item2.id, listId: list.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { item1, item2, list, itemList1, itemList2 };
};

export const createItemOnMultipleLists = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: item }, { body: list1 }, { body: list2 }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
  ]);

  const [{ body: itemList1 }, { body: itemList2 }] = await Promise.all([
    ctx.itemListHelpers.upsertItemOnList({
      payload: { itemId: item.id, listId: list1.id, quantity: 1 },
      accessToken,
    }),
    ctx.itemListHelpers.upsertItemOnList({
      payload: { itemId: item.id, listId: list2.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { item, list1, list2, itemList1, itemList2 };
};

export const createItemInPack = async (ctx: IntegrationTestContext, accessToken: string) => {
  const [{ body: item }, { body: pack }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
  ]);

  const { body: itemPack } = await ctx.itemPackHelpers.upsertItemPack({
    payload: { itemId: item.id, packId: pack.id, quantity: 1 },
    accessToken,
  });

  return { item, pack, itemPack };
};

export const createItemInMultiplePacks = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: item }, { body: pack1 }, { body: pack2 }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
  ]);

  const [{ body: itemPack1 }, { body: itemPack2 }] = await Promise.all([
    ctx.itemPackHelpers.upsertItemPack({
      payload: { itemId: item.id, packId: pack1.id, quantity: 1 },
      accessToken,
    }),
    ctx.itemPackHelpers.upsertItemPack({
      payload: { itemId: item.id, packId: pack2.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { item, pack1, pack2, itemPack1, itemPack2 };
};

export const createItemOnListAndInPack = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: item }, { body: list }, { body: pack }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
  ]);

  const [{ body: itemList }, { body: itemPack }] = await Promise.all([
    ctx.itemListHelpers.upsertItemOnList({
      payload: { itemId: item.id, listId: list.id, quantity: 1 },
      accessToken,
    }),
    ctx.itemPackHelpers.upsertItemPack({
      payload: { itemId: item.id, packId: pack.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { item, list, pack, itemList, itemPack };
};

export const createItemInPackInTrip = async (ctx: IntegrationTestContext, accessToken: string) => {
  const [{ body: item }, { body: pack }, { body: trip }] = await Promise.all([
    ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
    ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
  ]);

  const [{ body: updatedTrip }, { body: itemPack }] = await Promise.all([
    ctx.tripHelpers.updateTrip({
      id: trip.id,
      payload: { packId: pack.id },
      accessToken,
    }),
    ctx.itemPackHelpers.upsertItemPack({
      payload: { itemId: item.id, packId: pack.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { item, pack, trip: updatedTrip, itemPack };
};

export const createItemInMultiplePacksInMultipleTrips = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: item }, { body: pack1 }, { body: pack2 }, { body: trip1 }, { body: trip2 }] =
    await Promise.all([
      ctx.itemHelpers.createItem({ payload: ctx.itemHelpers.defaultItemDto, accessToken }),
      ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
      ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
      ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
      ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
    ]);

  const [{ body: updatedTrip1 }, { body: updatedTrip2 }, { body: itemPack1 }, { body: itemPack2 }] =
    await Promise.all([
      ctx.tripHelpers.updateTrip({
        id: trip1.id,
        payload: { packId: pack1.id },
        accessToken,
      }),
      ctx.tripHelpers.updateTrip({
        id: trip2.id,
        payload: { packId: pack2.id },
        accessToken,
      }),
      ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack1.id, quantity: 1 },
        accessToken,
      }),
      ctx.itemPackHelpers.upsertItemPack({
        payload: { itemId: item.id, packId: pack2.id, quantity: 1 },
        accessToken,
      }),
    ]);

  return { item, pack1, pack2, trip1: updatedTrip1, trip2: updatedTrip2, itemPack1, itemPack2 };
};

export const createListInPack = async (ctx: IntegrationTestContext, accessToken: string) => {
  const [{ body: list }, { body: pack }] = await Promise.all([
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
  ]);

  const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
    payload: { listId: list.id, packId: pack.id, quantity: 1 },
    accessToken,
  });

  return { list, pack, listPack };
};

export const createListInMultiplePacks = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: list }, { body: pack1 }, { body: pack2 }] = await Promise.all([
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
  ]);

  const [{ body: listPack1 }, { body: listPack2 }] = await Promise.all([
    ctx.listPackHelpers.upsertListInPack({
      payload: { listId: list.id, packId: pack1.id, quantity: 1 },
      accessToken,
    }),
    ctx.listPackHelpers.upsertListInPack({
      payload: { listId: list.id, packId: pack2.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { list, pack1, pack2, listPack1, listPack2 };
};

export const createListInPackInTrip = async (ctx: IntegrationTestContext, accessToken: string) => {
  const [{ body: list }, { body: pack }, { body: trip }] = await Promise.all([
    ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
    ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
    ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
  ]);

  const [{ body: updatedTrip }, { body: listPack }] = await Promise.all([
    ctx.tripHelpers.updateTrip({
      id: trip.id,
      payload: { packId: pack.id },
      accessToken,
    }),
    ctx.listPackHelpers.upsertListInPack({
      payload: { listId: list.id, packId: pack.id, quantity: 1 },
      accessToken,
    }),
  ]);

  return { list, pack, trip: updatedTrip, listPack };
};

export const createListInMultiplePacksInMultipleTrips = async (
  ctx: IntegrationTestContext,
  accessToken: string,
) => {
  const [{ body: list }, { body: pack1 }, { body: pack2 }, { body: trip1 }, { body: trip2 }] =
    await Promise.all([
      ctx.listHelpers.createList({ payload: ctx.listHelpers.defaultListDto, accessToken }),
      ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
      ctx.packHelpers.createPack({ payload: ctx.packHelpers.defaultPackDto, accessToken }),
      ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
      ctx.tripHelpers.createTrip({ payload: ctx.tripHelpers.defaultTripDto, accessToken }),
    ]);

  const [{ body: updatedTrip1 }, { body: updatedTrip2 }, { body: listPack1 }, { body: listPack2 }] =
    await Promise.all([
      ctx.tripHelpers.updateTrip({
        id: trip1.id,
        payload: { packId: pack1.id },
        accessToken,
      }),
      ctx.tripHelpers.updateTrip({
        id: trip2.id,
        payload: { packId: pack2.id },
        accessToken,
      }),
      ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack1.id, quantity: 1 },
        accessToken,
      }),
      ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack2.id, quantity: 1 },
        accessToken,
      }),
    ]);

  return { list, pack1, pack2, trip1: updatedTrip1, trip2: updatedTrip2, listPack1, listPack2 };
};
