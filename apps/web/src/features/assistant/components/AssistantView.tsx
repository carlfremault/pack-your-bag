'use client';

import { useCallback, useState } from 'react';

import { ColorTheme, colorThemes } from '@repo/react-common/color-themes';
import { QuantityStepper } from '@repo/react-common/input';

import { EmptyState } from '@/components/EmptyState';

import { AssistantItemForDisplay, GeneratedPackingList } from '../types';

import AssistantForm from './AssistantForm';
import GeneratedItemsList from './GeneratedItemsList';
import GeneratedItemsTable from './GeneratedItemsTable';
import SaveGeneratedPackingListForm from './SaveGeneratedPackingListForm';

export default function AssistantView() {
  const [generatedPackingList, setGeneratedPackingList] = useState<GeneratedPackingList | null>(
    null,
  );

  const handleChangeQuantity = useCallback((itemName: string, quantity: number): void => {
    setGeneratedPackingList((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        categories: prev.categories
          .map((category) => ({
            ...category,
            items: category.items
              .map((item) => (item.name === itemName ? { ...item, quantity } : item))
              .filter((item) => item.quantity !== 0),
          }))
          .filter((category) => category.items.length > 0),
      };
    });
  }, []);

  const itemActions = useCallback(
    (item: AssistantItemForDisplay) => (
      <QuantityStepper
        quantity={item.quantity}
        onChange={(qty) => handleChangeQuantity(item.name, qty)}
        groupAriaLabel={`Suggested quantity for ${item.name}`}
      />
    ),
    [handleChangeQuantity],
  );

  const resetAssistantForm = () => {
    setGeneratedPackingList(null);
  };

  if (!generatedPackingList)
    return (
      <div className="flex w-full max-w-7xl flex-col gap-4 overflow-y-auto p-4">
        <AssistantForm setGeneratedPackingList={setGeneratedPackingList} />
        <div className="bg-surface border-primary-ring text-primary rounded-md border p-6 text-center text-sm">
          <EmptyState
            message="No packing list generated."
            suggestion="Submit your trip criteria and have the AI packing assistant generate a packing list for you!"
          />
        </div>
      </div>
    );

  const colorThemeKeys = Object.keys(colorThemes);
  const categories = generatedPackingList.categories.map((category, index) => ({
    name: category.name,
    colorThemeKey: colorThemeKeys[index % colorThemeKeys.length] as ColorTheme,
  }));

  const formattedPackingList = generatedPackingList.categories.flatMap((category) => {
    const matchedCategory = categories?.find((c) => c.name === category.name);

    return category.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      note: item.note,
      category: {
        name: category.name,
        colorTheme: matchedCategory?.colorThemeKey ?? 'default',
      },
    }));
  });

  return (
    <div className="flex w-full max-w-7xl flex-col gap-4 overflow-y-auto p-4">
      <SaveGeneratedPackingListForm
        packingList={formattedPackingList}
        resetForm={resetAssistantForm}
      />
      {/* Mobile */}
      <div className="mb-32 flex flex-col gap-4 lg:hidden">
        <GeneratedItemsList generatedItems={formattedPackingList} itemsActions={itemActions} />
      </div>
      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:flex">
        <GeneratedItemsTable generatedItems={formattedPackingList} itemsActions={itemActions} />
      </div>
    </div>
  );
}
