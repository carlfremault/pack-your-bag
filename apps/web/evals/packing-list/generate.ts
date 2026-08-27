import { generateDataset } from './generate-dataset.ts';

await generateDataset(
  'Create a packing list for a trip',
  {
    destination: { type: 'string', description: 'Destination of the trip. Required input.' },
    activity: {
      type: 'array',
      description:
        'Activities to be done during the trip. For example: hiking, sightseeing, business, etc. Optional input, multiple options can be selected. Options are "hiking", "sightseeing", "cultural", "relaxing", "beach", "waterSports", "winterSports", "shopping", "business", "event", "cityTrip", "other".',
    },
    comfort: {
      type: 'string',
      description:
        'Comfort level of the trip. Optional input. Options are "minimalist", "standard", "comfortable", "luxury" or "other". When "other" is chosen the user is invited to provide clarification in the remarks field.',
    },
    transportation: {
      type: 'array',
      description:
        'Transportation options for the trip. Optional input, multiple options can be selected. Options are "plane", "car", "train", "bus", "boat", "bike", "motorhome", "other". When "other" is chosen the user is invited to provide clarification in the remarks field.',
    },
    accomodationType: {
      type: 'array',
      description:
        'Accommodation options for the trip. Optional input, multiple options can be selected. Options are "hotel", "hostel", "rental (airbnb)", "camping", "wild camping", "familyOrFriends", "other". When "other" is chosen the user is invited to provide clarification in the remarks field.',
    },
    luggageConstraints: {
      type: 'string',
      description:
        'Luggage constraints for the trip. Optional input. Options are "Carry-on only", "Checked bag", "Backpack (multi-day capacity)", "No restriction" or "Other".',
    },
    laundryAccess: {
      type: 'string',
      description:
        'Specifies if laundry can be done during the trip. Optional input. Options are "Yes" or "No".',
    },
    dateFrom: {
      type: 'string',
      description:
        'Starting date for the trip. Season during which the trip takes places needs to be taken into account. Optional input.',
    },
    dateUntil: {
      type: 'string',
      description:
        'Ending date for the trip. Season during which the trip takes places needs to be taken into account. Optional input.',
    },
    nbPersons: { type: 'string', description: 'Number of people for the trip. Optional input.' },
    remarks: { type: 'string', description: 'Extra remarks for the trip. Optional input.' },
  },
  5,
);
