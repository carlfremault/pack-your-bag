import { Injectable, Logger } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { SeedGuestDataResultDto } from './dto/seed-guest-data.dto';

@Injectable()
export class GuestSeedService {
  private readonly logger = new Logger(GuestSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedGuestData(userId: string): Promise<SeedGuestDataResultDto> {
    return this.prisma.$transaction(async (tx) => {
      const clothingCat = { id: uuidv7(), name: 'Clothing', colorTheme: 'sand' };
      const shelterCat = { id: uuidv7(), name: 'Shelter', colorTheme: 'jungle' };
      const gearCat = { id: uuidv7(), name: 'Gear', colorTheme: 'ocean' };
      const toiletCat = { id: uuidv7(), name: 'Toiletries', colorTheme: 'lavender' };
      const foodCat = { id: uuidv7(), name: 'Food', colorTheme: 'coral' };
      const categories = [clothingCat, shelterCat, gearCat, toiletCat, foodCat];

      await tx.category.createMany({
        data: categories.map((c) => ({ ...c, userId })),
      });

      const items = [
        { id: uuidv7(), name: 'Hiking boots', categoryId: clothingCat.id, weight: 900 },
        { id: uuidv7(), name: 'Rain jacket', categoryId: clothingCat.id, weight: 350 },
        { id: uuidv7(), name: 'Hiking socks', categoryId: clothingCat.id, weight: 120 },
        { id: uuidv7(), name: 'Base layer top', categoryId: clothingCat.id, weight: 180 },
        { id: uuidv7(), name: 'Fleece', categoryId: clothingCat.id, weight: 320 },
        { id: uuidv7(), name: 'Tent', categoryId: shelterCat.id, weight: 2100 },
        { id: uuidv7(), name: 'Sleeping bag', categoryId: shelterCat.id, weight: 1200 },
        { id: uuidv7(), name: 'Sleeping pad', categoryId: shelterCat.id, weight: 500 },
        { id: uuidv7(), name: 'Headlamp', categoryId: gearCat.id, weight: 80 },
        { id: uuidv7(), name: 'Water bottle (1 L)', categoryId: gearCat.id, weight: 180 },
        { id: uuidv7(), name: 'First aid kit', categoryId: gearCat.id, weight: 200 },
        { id: uuidv7(), name: 'Trail map', categoryId: gearCat.id, weight: 50 },
        { id: uuidv7(), name: 'Toothbrush', categoryId: toiletCat.id, weight: 20 },
        { id: uuidv7(), name: 'Sunscreen', categoryId: toiletCat.id, weight: 100 },
        { id: uuidv7(), name: 'Breakfast mix', categoryId: foodCat.id, weight: 150 },
        { id: uuidv7(), name: 'Energy bar', categoryId: foodCat.id, weight: 60 },
        { id: uuidv7(), name: 'Freeze dried dinner', categoryId: foodCat.id, weight: 100 },
      ];

      await tx.item.createMany({
        data: items.map((i) => ({ ...i, userId })),
      });

      const essentialsList = { id: uuidv7(), name: 'Hiking essentials', colorTheme: 'coral' };
      const overnightList = { id: uuidv7(), name: 'Overnight gear', colorTheme: 'slate' };
      const foodList = { id: uuidv7(), name: 'Food one day', colorTheme: 'ocean' };
      const lists = [essentialsList, overnightList, foodList];

      await tx.list.createMany({
        data: lists.map((l) => ({ ...l, userId })),
      });

      const itemByName = (name: string) => items.find((i) => i.name === name)!;
      const itemListLinks = [
        { itemId: itemByName('Hiking boots').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('Rain jacket').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('Water bottle (1 L)').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('Trail map').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('Headlamp').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('First aid kit').id, listId: essentialsList.id, quantity: 1 },
        { itemId: itemByName('Tent').id, listId: overnightList.id, quantity: 1 },
        { itemId: itemByName('Sleeping bag').id, listId: overnightList.id, quantity: 1 },
        { itemId: itemByName('Sleeping pad').id, listId: overnightList.id, quantity: 1 },
        { itemId: itemByName('Breakfast mix').id, listId: foodList.id, quantity: 1 },
        { itemId: itemByName('Energy bar').id, listId: foodList.id, quantity: 2 },
        { itemId: itemByName('Freeze dried dinner').id, listId: foodList.id, quantity: 1 },
      ];

      await tx.itemList.createMany({
        data: itemListLinks.map((link) => ({ id: uuidv7(), ...link })),
      });

      const pack = { id: uuidv7(), name: 'Weekend hike pack', colorTheme: 'jungle' };

      await tx.pack.create({ data: { ...pack, userId } });

      await tx.listPack.createMany({
        data: [
          { id: uuidv7(), listId: essentialsList.id, packId: pack.id, quantity: 1 },
          { id: uuidv7(), listId: overnightList.id, packId: pack.id, quantity: 1 },
          { id: uuidv7(), listId: foodList.id, packId: pack.id, quantity: 2 },
        ],
      });

      const extraPackItems = [
        { itemId: itemByName('Hiking socks').id, packId: pack.id, quantity: 2 },
        { itemId: itemByName('Base layer top').id, packId: pack.id, quantity: 1 },
        { itemId: itemByName('Fleece').id, packId: pack.id, quantity: 1 },
        { itemId: itemByName('Toothbrush').id, packId: pack.id, quantity: 1 },
        { itemId: itemByName('Sunscreen').id, packId: pack.id, quantity: 1 },
      ];

      await tx.itemPack.createMany({
        data: extraPackItems.map((link) => ({ id: uuidv7(), ...link })),
      });

      const trip = { id: uuidv7(), name: 'Sample weekend hike' };

      await tx.trip.create({ data: { ...trip, userId, packId: pack.id } });

      this.logger.log(`Seeded guest data for user ${userId}`);

      return {
        categories: categories.length,
        items: items.length,
        lists: lists.length,
        packs: 1,
        trips: 1,
      };
    });
  }
}
